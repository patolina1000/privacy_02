'use client'

// Eventos de funil (client-side) enviados para o nosso /api/monitor, que
// repassa ao Monitor externo. Fail-safe: nunca pode quebrar a página.

export type FunnelStep =
  | 'site_view'      // lead chegou no site
  | 'checkout_open'  // abriu o checkout do plano principal
  | 'main_paid'      // pagou o plano principal
  | 'upsell1_view'   // chegou no Upsell 1 (Verificação)
  | 'upsell1_paid'   // pagou o Upsell 1
  | 'upsell2_view'   // chegou no Upsell 2 (Liberação)
  | 'upsell2_paid'   // pagou o Upsell 2
  | 'funnel_complete' // chegou na tela final

export function trackFunnel(step: FunnelStep): void {
  try {
    fetch('/api/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
      keepalive: true, // entrega mesmo se o usuário sair da página
    }).catch(() => {})
  } catch {
    // silencioso de propósito
  }
}
