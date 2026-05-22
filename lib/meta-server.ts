import crypto from 'crypto'

// Meta Conversions API (server-side) — Facebook + Instagram.
// Espelha lib/tiktok-server.ts. Dedup com o pixel via event_id.

const PIXEL_ID = process.env.META_PIXEL_ID || ''
const GRAPH_VERSION = 'v21.0'
const TIMEOUT_MS = 6000

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface MetaServerEvent {
  event: string
  event_id?: string
  email?: string
  phone?: string
  ip?: string
  user_agent?: string
  fbc?: string
  fbp?: string
  value?: number
  currency?: string
  content_id?: string
  content_name?: string
  url?: string
}

export async function sendMetaEvent(events: MetaServerEvent[]) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token || !PIXEL_ID) {
    console.log('[Meta CAPI] META_PIXEL_ID/ACCESS_TOKEN não configurado — pulando')
    return
  }

  const testCode = process.env.META_TEST_EVENT_CODE
  const names = events.map((e) => e.event).join(', ')

  const payload: Record<string, unknown> = {
    data: events.map((e) => {
      const user_data: Record<string, unknown> = {}
      if (e.email) user_data.em = sha256(e.email)
      if (e.phone) user_data.ph = sha256(e.phone.replace(/\D/g, ''))
      if (e.ip) user_data.client_ip_address = e.ip
      if (e.user_agent) user_data.client_user_agent = e.user_agent
      if (e.fbc) user_data.fbc = e.fbc
      if (e.fbp) user_data.fbp = e.fbp

      const custom_data: Record<string, unknown> = { currency: e.currency || 'BRL' }
      if (e.value !== undefined && e.value > 0) custom_data.value = e.value
      if (e.content_id) {
        custom_data.content_ids = [e.content_id]
        custom_data.content_type = 'product'
        if (e.content_name) custom_data.content_name = e.content_name
      }

      return {
        event_name: e.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.event_id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        action_source: 'website',
        ...(e.url ? { event_source_url: e.url } : {}),
        user_data,
        custom_data,
      }
    }),
    ...(testCode ? { test_event_code: testCode } : {}),
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`
  const body = JSON.stringify(payload)

  // retry — falha de rede transitória não pode perder a conversão
  for (let attempt = 1; attempt <= 3; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      })
      const data = await res.json()
      clearTimeout(timer)
      if (data?.error) {
        console.log(`[Meta CAPI] ${names} → erro: ${data.error.message}`)
      } else {
        console.log(
          `[Meta CAPI] ${names} → ok (received: ${data?.events_received ?? '?'})` +
            (attempt > 1 ? ` (tentativa ${attempt})` : '')
        )
      }
      return
    } catch (err) {
      clearTimeout(timer)
      if (attempt === 3) console.error(`[Meta CAPI] falhou após ${attempt} tentativas:`, err)
      else await new Promise((r) => setTimeout(r, 400 * attempt))
    }
  }
}
