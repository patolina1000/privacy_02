import { NextRequest, NextResponse } from 'next/server'
import { isPaid, markPaid } from '@/lib/payment-store'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  // Webhook já confirmou? Retorna imediatamente sem chamar a Nexus
  if (isPaid(id)) {
    return NextResponse.json({ status: 'paid' })
  }

  const apiKey = process.env.NEXUSPAG_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })

  const res = await fetch(`https://nexuspag.com/api/pix/${id}`, {
    headers: { 'x-api-key': apiKey },
    cache: 'no-store',
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data?.message || 'Erro ao consultar PIX' }, { status: res.status })
  }

  // Se a Nexus confirmar via polling, guarda no store também
  if (data.status === 'paid') markPaid(id)

  return NextResponse.json({ status: data.status })
}
