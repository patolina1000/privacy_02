import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getPixCola } from '@/lib/qr-store'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  console.log('[QR] id recebido:', id)

  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  let pixCola = getPixCola(id)
  console.log('[QR] store hit:', !!pixCola, '| length:', pixCola?.length ?? 0)

  // Fallback: busca pix_copia_cola da Nexus se não está no store
  if (!pixCola) {
    console.log('[QR] Store miss — consultando Nexus como fallback')
    const apiKey = process.env.NEXUSPAG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    const res = await fetch(`https://nexuspag.com/api/pix/${id}`, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store',
    })

    console.log('[QR] Nexus fallback HTTP status:', res.status)
    const data = await res.json()

    if (!res.ok) {
      console.log('[QR] ERRO Nexus fallback:', JSON.stringify(data))
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: res.status })
    }

    pixCola = data.pix_copia_cola ?? ''
    console.log('[QR] pix_copia_cola via fallback, length:', pixCola?.length ?? 0)
  }

  if (!pixCola) {
    console.log('[QR] ERRO: pix_copia_cola vazio')
    return NextResponse.json({ error: 'Dados PIX não disponíveis' }, { status: 404 })
  }

  // Gera QR code a partir do pix_copia_cola (string EMV)
  console.log('[QR] Gerando QR code a partir do pix_copia_cola...')
  const buffer = await QRCode.toBuffer(pixCola, {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
  })

  console.log('[QR] QR gerado com sucesso, buffer size:', buffer.length, 'bytes')

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  })
}
