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
  | 'upsell3_view'   // chegou no Upsell 3 (Verificação Final)
  | 'upsell3_paid'   // pagou o Upsell 3
  | 'upsell4_view'   // chegou no Upsell 4 (Acesso VIP Completo)
  | 'upsell4_paid'   // pagou o Upsell 4
  | 'funnel_complete' // chegou na tela final
  | 'bump_videocall' // order bump da videochamada aceito (checkout principal)
  | 'bump_whatsapp'  // order bump do WhatsApp aceito (Upsell 1)
  | 'bump_calcinha'  // order bump da calcinha aceito (Upsell 2)
  | 'bump_packsecreto' // order bump do Pack Secreto aceito (Upsell 4)

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
