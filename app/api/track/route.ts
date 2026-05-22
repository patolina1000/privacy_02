import { NextRequest, NextResponse } from 'next/server'
import { sendTikTokEvent } from '@/lib/tiktok-server'
import { sendMetaEvent } from '@/lib/meta-server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    event, event_id, email, name, value,
    content_id, content_name, order_id,
    ttclid, ttp, fbc, fbp, url,
  } = body

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  const user_agent = req.headers.get('user-agent') || ''

  // TikTok + Meta em paralelo. Cada um é fail-safe internamente.
  await Promise.allSettled([
    sendTikTokEvent([{
      event,
      event_id,
      email,
      ip,
      user_agent,
      ttclid,
      ttp,
      value,
      currency: 'BRL',
      content_id: content_id || 'plan',
      content_name,
      order_id,
      url,
    }]),
    sendMetaEvent([{
      event,
      event_id,
      email,
      ip,
      user_agent,
      fbc,
      fbp,
      value,
      currency: 'BRL',
      content_id: content_id || 'plan',
      content_name,
      url,
    }]),
  ])

  return NextResponse.json({ ok: true })
}
