'use client'

import { useEffect } from 'react'
import { trackFunnel } from '@/lib/funnel'

// Dispara 1 lead (site_view) por sessão do navegador. Recarregar a mesma
// aba não infla; abrir nova sessão conta como nova visita.
export default function FunnelTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('mv_lead')) return
      sessionStorage.setItem('mv_lead', '1')
    } catch {
      // sem sessionStorage (modo restrito): conta mesmo assim
    }
    trackFunnel('site_view')
  }, [])

  return null
}
