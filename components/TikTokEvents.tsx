'use client'

import { useEffect } from 'react'
import { captureTtclid, trackEvent } from '@/lib/tiktok-pixel'
import site from '@/config/site.json'

const highlightedPlan = site.plans.find((p) => p.highlight) ?? site.plans[0]
const pageValue = parseFloat(highlightedPlan.price.replace(',', '.'))

export default function TikTokEvents() {
  useEffect(() => {
    // Captura ttclid da URL (vindo de anúncio TikTok)
    captureTtclid()

    // ViewContent: usuário entrou na landing page
    trackEvent({
      event: 'ViewContent',
      content_id: highlightedPlan.id,
      content_name: highlightedPlan.title,
      value: pageValue,
      currency: 'BRL',
    })
  }, [])

  return null
}
