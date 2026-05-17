import { NextRequest, NextResponse } from 'next/server'
import { notifyMonitor } from '@/lib/monitor'

// Recebe os eventos de funil do client e repassa ao Monitor externo
// server-side (mantém token/domínio fora do navegador, sem CORS).

const STEPS = new Set([
  'site_view',
  'checkout_open',
  'main_paid',
  'upsell1_view',
  'upsell1_paid',
  'upsell2_view',
  'upsell2_paid',
  'funnel_complete',
])

export async function POST(req: NextRequest) {
  let step = ''
  try {
    step = String((await req.json())?.step || '')
  } catch {
    return NextResponse.json({ error: 'json inválido' }, { status: 400 })
  }

  if (!STEPS.has(step)) {
    return NextResponse.json({ error: 'step desconhecido' }, { status: 400 })
  }

  // notifyMonitor já é fail-safe (timeout + erros engolidos)
  await notifyMonitor('funnel', { step })

  return NextResponse.json({ ok: true })
}
