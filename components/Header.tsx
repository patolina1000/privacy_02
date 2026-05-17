'use client'

import { motion } from 'framer-motion'
import PrivacyLogo from './icons/PrivacyLogo'
import { PromoConfig } from '@/types/site'

interface Props {
  promo: PromoConfig
}

export default function Header({ promo }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white">
      {promo.enabled && (
        <div className="bg-[#ff6b1a] text-white text-center py-2 px-4 text-xs font-semibold tracking-wide">
          <span className='pill'>
            {promo.text}
          </span>
        </div>
      )}
      <div className="flex items-center justify-center py-3 border-b border-gray-100">
        <PrivacyLogo className="h-9 w-auto" />
      </div>
    </header>
  )
}
