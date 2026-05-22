import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { markPaid } from '@/lib/payment-store'
import { notifyMonitor } from '@/lib/monitor'
import { sendTikTokEvent } from '@/lib/tiktok-server'
import { sendMetaEvent } from '@/lib/meta-server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Valida assinatura HMAC se o secret estiver configurado
  const secret = process.env.NEXUSPAG_WEBHOOK_SECRET
  if (secret) {
    const signature = req.headers.get('x-nexuspag-signature') ?? ''
    const match = signature.match(/t=(\d+),v1=([a-f0-9]+)/)
    if (!match) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }
    const [, timestamp, receivedHmac] = match
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(receivedHmac), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'payment.confirmed') {
    markPaid(event.transaction_id)

    // Espelha a venda no Monitor. Já é protegido internamente, mas o
    // try/catch garante que uma falha aqui nunca mude o 200 pra Nexus
    // (senão a Nexus reenvia o webhook indefinidamente).
    try {
      await notifyMonitor('payment.confirmed', {
        transaction_id: event.transaction_id,
        external_id: event.external_id ?? null,
        amount: event.amount ?? null,
        fee: event.fee ?? null,
        net_amount: event.net_amount ?? null,
        paid_at: event.paid_at ?? null,
      })
    } catch {}

    // Purchase server-side: a venda é certa aqui, independente do
    // cliente ter fechado a aba. event_id determinístico = mesmo do
    // client (purchase_<txid>), então TikTok e Meta deduplicam (não 2x).
    try {
      const extId = String(event.external_id ?? '')
      const isUpsell = extId.startsWith('up-')
      const amount =
        typeof event.amount === 'number' ? event.amount : Number(event.amount) || undefined
      const eventId = `purchase_${event.transaction_id}`
      const contentId = isUpsell ? 'upsell' : 'plan'
      const contentName = isUpsell ? 'Upsell' : 'Plano principal'

      await Promise.allSettled([
        sendTikTokEvent([{
          event: 'Purchase',
          event_id: eventId,
          value: amount,
          currency: 'BRL',
          content_id: contentId,
          content_name: contentName,
          order_id: String(event.transaction_id),
        }]),
        sendMetaEvent([{
          event: 'Purchase',
          event_id: eventId,
          value: amount,
          currency: 'BRL',
          content_id: contentId,
          content_name: contentName,
        }]),
      ])
    } catch {}
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
