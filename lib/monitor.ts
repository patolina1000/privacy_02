// Envia eventos de venda para o Monitor externo.
// Fail-safe por design: se o monitor estiver fora do ar, lento ou mal
// configurado, NADA aqui pode quebrar o checkout. Sempre engole erros.

import siteConfig from '@/config/site.json'

const MONITOR_URL = process.env.MONITOR_URL || ''
const MONITOR_TOKEN = process.env.MONITOR_TOKEN || ''
const TIMEOUT_MS = 4000

// Cada clone é identificado pelo domínio público. No Render isso vem de
// RENDER_EXTERNAL_URL automaticamente; localmente cai em APP_URL.
function getDomain(): string {
  const url = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || ''
  try {
    return url ? new URL(url).host : 'local'
  } catch {
    return 'local'
  }
}

const MODEL_NAME =
  (siteConfig as { model?: { name?: string } })?.model?.name || 'desconhecido'

export type MonitorEvent = 'pix.created' | 'payment.confirmed' | 'funnel'

// Retorna uma Promise para o caller poder (opcionalmente) aguardar.
// O webhook de pagamento aguarda; o create dispara e segue.
export async function notifyMonitor(
  event: MonitorEvent,
  data: Record<string, unknown>
): Promise<void> {
  if (!MONITOR_URL) return

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    await fetch(MONITOR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-monitor-token': MONITOR_TOKEN,
      },
      body: JSON.stringify({
        event,
        domain: getDomain(),
        model: MODEL_NAME,
        at: new Date().toISOString(),
        ...data,
      }),
      signal: controller.signal,
    })
  } catch {
    // monitor indisponível não pode afetar o cliente — silencioso de propósito
  } finally {
    clearTimeout(timer)
  }
}
