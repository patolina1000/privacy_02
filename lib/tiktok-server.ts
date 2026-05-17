import crypto from 'crypto'

const PIXEL_ID = process.env.TIKTOK_PIXEL_ID || ''
const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export interface TikTokServerEvent {
  event: string
  event_id?: string
  email?: string
  ip?: string
  user_agent?: string
  ttclid?: string
  ttp?: string
  value?: number
  currency?: string
  content_id?: string
  content_name?: string
  order_id?: string
  url?: string
}

export async function sendTikTokEvent(events: TikTokServerEvent[]) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN
  if (!accessToken) {
    console.log('[TikTok API] TIKTOK_ACCESS_TOKEN não configurado — pulando server event')
    return
  }

  const eventNames = events.map((e) => e.event).join(', ')

  const testCode = process.env.TIKTOK_TEST_EVENT_CODE

  const payload: Record<string, unknown> = {
    pixel_code: PIXEL_ID,
    event_source: 'web',
    event_source_id: PIXEL_ID,
    ...(testCode && { test_event_code: testCode }),
    data: events.map((e) => {
      const user: Record<string, string> = {}
      if (e.email) {
        user.email = sha256(e.email)
        user.external_id = sha256(e.email)
      }
      if (e.ip) user.ip = e.ip
      if (e.user_agent) user.user_agent = e.user_agent
      if (e.ttclid) user.ttclid = e.ttclid
      if (e.ttp) user.ttp = e.ttp

      const properties: Record<string, unknown> = {
        url: e.url || 'https://privacy-landing.onrender.com',
        currency: e.currency || 'BRL',
        content_type: 'product',
      }
      if (e.value !== undefined && e.value > 0) properties.value = e.value
      if (e.order_id) properties.order_id = e.order_id
      if (e.content_id) {
        properties.contents = [
          {
            content_id: e.content_id,
            content_type: 'product',
            content_name: e.content_name || e.content_id,
            ...(e.value !== undefined && e.value > 0 ? { price: e.value } : {}),
            quantity: 1,
          },
        ]
      }

      return {
        event: e.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.event_id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        user,
        properties,
      }
    }),
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    console.log(`[TikTok API] ${eventNames} → code: ${data?.code} ${data?.message ?? ''}`)
  } catch (err) {
    console.error('[TikTok API] Erro ao enviar evento:', err)
  }
}
