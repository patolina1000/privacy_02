'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PrivacyLogo from './icons/PrivacyLogo'
import { PromoConfig } from '@/types/site'

interface Props {
  promo: PromoConfig
}

export default function Header({ promo }: Props) {
  // A data da promo é sempre HOJE (urgência). Troca qualquer
  // DD/MM/AAAA do texto pela data atual do visitante. Roda no
  // useEffect pra não dar mismatch de hidratação (SSR x cliente).
  const [promoText, setPromoText] = useState(promo.text)
  useEffect(() => {
    const hoje = new Date().toLocaleDateString('pt-BR') // dd/mm/aaaa
    setPromoText(promo.text.replace(/\d{2}\/\d{2}\/\d{4}/, hoje))
  }, [promo.text])

  return (
    <header className="sticky top-0 z-40 bg-white">
      {promo.enabled && (
        <div className="bg-[#ff6b1a] text-white text-center py-2 px-4 text-xs font-semibold tracking-wide">
          <span className='pill'>
            {promoText}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center py-3 border-b border-gray-100">
        <PrivacyLogo className="h-9 w-auto" />
      </div>
    </header>
  )
}
