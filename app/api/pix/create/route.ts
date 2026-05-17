import { NextRequest, NextResponse } from 'next/server'
import { savePixCola } from '@/lib/qr-store'
import { notifyMonitor } from '@/lib/monitor'

export async function POST(req: NextRequest) {
  const { amount, description, external_id } = await req.json()
  console.log('[CREATE] amount:', amount, '| external_id:', external_id)

  const apiKey = process.env.NEXUSPAG_API_KEY
  console.log('[CREATE] API key presente:', !!apiKey, '| prefixo:', apiKey?.slice(0, 8))

  if (!apiKey) {
    return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
  }

  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || ''
  const webhookUrl = appUrl ? `${appUrl}/api/pix/webhook` : undefined
  console.log('[CREATE] webhook_url:', webhookUrl)

  const body: Record<string, unknown> = {
    amount,
    description,
    external_id,
    expiration: 1800,
  }
  if (webhookUrl) body.webhook_url = webhookUrl

  const res = await fetch('https://nexuspag.com/api/pix/create', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  console.log('[CREATE] Nexus HTTP status:', res.status)

  const data = await res.json()

  if (!res.ok) {
    console.log('[CREATE] ERRO Nexus:', JSON.stringify(data))
    return NextResponse.json({ error: data?.message || 'Erro ao gerar PIX' }, { status: res.status })
  }

  const txId: string = data.transaction?.id
  const pixCola: string = data.transaction?.pix_copia_cola ?? ''
  console.log('[CREATE] transaction.id:', txId)
  console.log('[CREATE] pix_copia_cola length:', pixCola.length)

  if (txId && pixCola) {
    savePixCola(txId, pixCola)
    console.log('[CREATE] pix_copia_cola salvo no store para id:', txId)
  } else {
    console.log('[CREATE] AVISO: pix_copia_cola ausente na resposta da Nexus')
  }

  // Conta o PIX gerado no Monitor (denominador da taxa de conversão).
  // Fire-and-forget: não pode atrasar a resposta pro cliente.
  if (txId) {
    void notifyMonitor('pix.created', { transaction_id: txId, external_id, amount })
  }

  return NextResponse.json(data)
}
