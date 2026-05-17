import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { markPaid } from '@/lib/payment-store'
import { notifyMonitor } from '@/lib/monitor'

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
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
