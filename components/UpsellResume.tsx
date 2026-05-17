'use client'

import { useEffect, useState } from 'react'
import UpsellFunnel, { FunnelStep } from './UpsellFunnel'

const UPSELL_STEPS: FunnelStep[] = [
  'upsell1',
  'upsell2',
  'upsell3',
  'upsell4',
  'upsell5',
]

// Se o lead pagou e recarregou a página, ele volta preso no funil
// de taxas no passo onde parou (lido do localStorage gravado pelo
// próprio UpsellFunnel). Sem isso, recarregar perdia o funil.
export default function UpsellResume() {
  const [step, setStep] = useState<FunnelStep | null>(null)

  useEffect(() => {
    try {
      const s = localStorage.getItem('mv_upsell') as FunnelStep | null
      if (s && UPSELL_STEPS.includes(s)) setStep(s)
    } catch {
      // sem localStorage: ignora
    }
  }, [])

  if (!step) return null

  return (
    <UpsellFunnel
      initialStep={step}
      onClose={() => {
        try { localStorage.removeItem('mv_upsell') } catch {}
        setStep(null)
      }}
    />
  )
}
