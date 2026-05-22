'use client'

// Helpers client-side do Meta Pixel (Facebook/Instagram).

function readCookie(name: string): string {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? decodeURIComponent(m[1]) : ''
  } catch {
    return ''
  }
}

// _fbp é setado automaticamente pelo pixel ao carregar.
export function getFbp(): string {
  return readCookie('_fbp')
}

// _fbc vem do fbclid. Se o cookie ainda não existe (primeiro hit),
// montamos no formato oficial fb.1.<timestamp>.<fbclid>.
export function getFbc(): string {
  const c = readCookie('_fbc')
  if (c) return c
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (fbclid) return `fb.1.${Date.now()}.${fbclid}`
  } catch {}
  return ''
}

// Dispara um evento no pixel do navegador com o mesmo event_id usado
// no CAPI — o Meta deduplica e não conta 2x.
export function metaPixelTrack(
  event: string,
  params: Record<string, unknown>,
  eventId: string
): void {
  try {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
    if (fbq) fbq('track', event, params, { eventID: eventId })
  } catch {
    // pixel ausente — silencioso de propósito
  }
}
