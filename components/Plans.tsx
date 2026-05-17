'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import ShieldIcon from './icons/ShieldIcon'
import BoltIcon from './icons/BoltIcon'
import ChevronIcon from './icons/ChevronIcon'
import PixModal from './PixModal'
import UpsellFunnel from './UpsellFunnel'
import { PlanConfig } from '@/types/site'

interface Props {
  plans: PlanConfig[]
}

const badgeStyles: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-600',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Plans({ plans }: Props) {
  const [promoOpen, setPromoOpen] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)

  const highlighted = plans.find((p) => p.highlight)
  const others = plans.filter((p) => !p.highlight)

  return (
    <>
    {selectedPlan && (
      <PixModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onPaid={() => { setSelectedPlan(null); setShowUpsell(true) }}
      />
    )}
    {showUpsell && <UpsellFunnel onClose={() => setShowUpsell(false)} />}
    <section className="mx-4 px-4 py-4 bg-white border-2 border-gray-200 border rounded-xl">
      <h2 className="text-xl font-bold text-gray-900 mb-3">Assinaturas</h2>

      {/* Highlighted plan */}
      {highlighted && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-3"
        >
          {/* Badge */}
          <div className="flex gap-2 mb-2">
            <span className="bg-orange-100 text-[#A0490c] text-xs font-bold px-3 py-1 rounded-full">
              {highlighted.cta}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeStyles[highlighted.badgeColor]}`}>
              {highlighted.badge}
            </span>
          </div>

          {/* Main button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedPlan(highlighted)}
            className="w-full bg-gradient-to-r from-[#ff6b1a] to-[#ff8c42] text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg shadow-orange-200/50 active:shadow-none transition-shadow font-black"
          >
            <span className="text-lg">{highlighted.title}</span>
            <span className="flex items-center gap-1 text-lg">
              R$ {highlighted.price}
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 ml-1">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </motion.button>

          {/* Extra badge */}
          {highlighted.extra && (
            <div className="mt-2 w-fit bg-orange-100 rounded-full py-1 px-3">
              <span className="text-[#6E260B] text-xs font-extrabold">{highlighted.extra}</span>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs text-green-500">
              <ShieldIcon className="w-4 h-4"/>
              <span className='text-gray-600'>Pagamento 100% seguro</span>
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1 text-xs text-green-500">
              <BoltIcon className="w-4 h-4" />
              <span className='text-gray-600'>Acesso imediato</span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Promoções accordion */}
      <div className="rounded-2xl overflow-hidden">
        <button
          onClick={() => setPromoOpen(!promoOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white"
        >
          <span className="text-sm font-semibold text-gray-700">Promoções</span>
          <ChevronIcon
            className="w-5 h-5 text-gray-400 transition-transform duration-200"
            direction={promoOpen ? 'up' : 'down'}
          />
        </button>

        {promoOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-3 pb-3 flex flex-col gap-2"
          >
            {others.map((plan, i) => (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full border border-[#E6BFA6] rounded-xl px-4 py-3 flex items-start justify-between transition-colors ${
                  plan.title === '3 Meses' ? 'bg-orange-100 active:bg-[#ffe6d6]' : 'bg-white active:bg-orange-100'
                }`}
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    {plan.title === '3 Meses' && <span>👑</span>}
                    <span className="text-sm font-bold text-gray-900">{plan.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeStyles[plan.badgeColor]}`}>
                      {plan.badge}
                    </span>
                  </div>
                  <span className="text-sm font-black text-gray-900 mt-1">R$ {plan.price}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </section>
    </>
  )
}
