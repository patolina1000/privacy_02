'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ComboConfig } from '@/types/site'
import PixModal from './PixModal'
import UpsellFunnel from './UpsellFunnel'

interface Props {
  combo: ComboConfig
}

export default function Combo({ combo }: Props) {
  const [open, setOpen] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  if (!combo.enabled) return null

  const comboPlan = {
    id: 'combo',
    title: combo.title,
    price: combo.price,
    badge: 'Exclusivo',
    badgeColor: 'blue' as const,
    highlight: false,
    cta: combo.cta,
  }

  return (
    <>
    {open && (
      <PixModal
        plan={comboPlan}
        onClose={() => setOpen(false)}
        onPaid={() => { setOpen(false); setShowUpsell(true) }}
      />
    )}
    {showUpsell && <UpsellFunnel onClose={() => setShowUpsell(false)} />}
    <section className="px-4 py-4 bg-white border-t border-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="bg-[#111] rounded-3xl overflow-hidden border border-[#ff6b1a]/30"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-5 text-center">
          <h2 className="text-white text-xl font-black leading-tight">
            🔥 {combo.title}
          </h2>
          <p className="text-gray-400 text-sm mt-1">{combo.subtitle}</p>
        </div>

        {/* Benefits */}
        <div className="px-5 pb-5 space-y-0 divide-y divide-white/5">
          {combo.benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 py-3"
            >
              <div className="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-white text-sm font-medium">{benefit}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA button — título + preço no mesmo botão, igual ao print */}
        <div className="px-5 pb-6">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen(true)}
            className="w-full bg-[#ff6b1a] text-white rounded-2xl py-4 px-5 flex items-center justify-between shadow-lg shadow-orange-500/20 active:shadow-none transition-shadow"
          >
            <span className="font-black text-base leading-tight text-left">
              🔥 {combo.title}
            </span>
            <span className="flex items-center gap-1 font-black text-base whitespace-nowrap">
              R$ {combo.price}
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 ml-1">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </motion.button>
        </div>
      </motion.div>
    </section>
    </>
  )
}
