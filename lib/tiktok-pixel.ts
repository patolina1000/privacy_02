// Tracking client-side unificado: dispara TikTok Pixel + Meta Pixel
// e repassa pro /api/track (que chama as duas Conversions APIs).
// O mesmo event_id é usado em tudo, então cada rede deduplica sozinha.

import { getFbc, getFbp, metaPixelTrack } from './meta-pixel'

export function genEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getTtclid(): string {
  try { return sessionStorage.getItem('ttclid') || '' } catch { return '' }
}

export function getTtp(): string {
  try {
    const m = document.cookie.match(/(?:^|; )_ttp=([^;]*)/)
    return m ? decodeURIComponent(m[1]) : ''
  } catch { return '' }
}

export function captureTtclid() {
  try {
    const p = new URLSearchParams(window.location.search)
    const v = p.get('ttclid')
    if (v) sessionStorage.setItem('ttclid', v)
  } catch {}
}

function getPixel() {
  return (window as any).ttq ?? null
}

export function pixelIdentify(email: string) {
  try {
    const ttq = getPixel()
    if (ttq) ttq.identify({ email, external_id: email })
  } catch {}
}

export async function trackEvent(params: {
  event: string
  email?: string
  name?: string
  value?: number
  currency?: string
  content_id?: string
  content_name?: string
  order_id?: string
  event_id?: string
}) {
  const { event, email, name, value, currency, content_id, content_name, order_id } = params
  // event_id determinístico (Purchase usa purchase_<txid>) — TikTok e
  // Meta deduplicam pixel + Conversions API client + server (webhook).
  const event_id = params.event_id || genEventId()
  const ttclid = getTtclid()
  const ttp = getTtp()
  const fbc = getFbc()
  const fbp = getFbp()
  const url = typeof window !== 'undefined' ? window.location.href : ''

  // 1. Identify (se tiver email)
  if (email) pixelIdentify(email)

  // 2. Pixel TikTok client-side
  try {
    const ttq = getPixel()
    if (ttq) {
      const props: Record<string, unknown> = { currency: 'BRL', content_type: 'product' }
      if (value !== undefined) props.value = value
      if (content_id) props.content_id = content_id
      if (content_name) props.content_name = content_name
      if (order_id) props.order_id = order_id
      ttq.track(event, props, { event_id })
    }
  } catch {}

  // 3. Pixel Meta client-side (Facebook/Instagram)
  try {
    const mProps: Record<string, unknown> = { currency: 'BRL' }
    if (value !== undefined) mProps.value = value
    if (content_id) {
      mProps.content_ids = [content_id]
      mProps.content_type = 'product'
      if (content_name) mProps.content_name = content_name
    }
    if (order_id) mProps.order_id = order_id
    metaPixelTrack(event, mProps, event_id)
  } catch {}

  // 4. Conversions API server-side (TikTok + Meta) — fire-and-forget
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event, event_id, email, name, value,
      content_id, content_name, order_id,
      ttclid, ttp, fbc, fbp, url,
    }),
  }).catch(() => {})
}
