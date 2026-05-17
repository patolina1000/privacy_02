'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaqItem } from '@/types/site'

interface Props {
  faq: FaqItem[]
}

function FAQCard({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      layout
      className="bg-white rounded-md overflow-hidden border border-gray-300"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left"
      >
        <span className={`flex-shrink-0 text-lg font-light leading-none mt-0.5 transition-colors ${open ? 'text-[#ff6b1a]' : 'text-[#ff6b1a]'}`}>
          {open ? '−' : '+'}
        </span>
        <span className={`text-sm font-semibold leading-snug ${open ? 'text-[#ff6b1a]' : 'text-gray-800'}`}>
          {item.question}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-sm text-gray-500 text-center pb-5 px-5 leading-relaxed">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ({ faq }: Props) {
  return (
    <section className="px-4 py-6 bg-[#f5f5f5] border-t border-gray-100">
      <h2 className="text-2xl font-black text-[#ff6b1a] text-center mb-5">
        Perguntas Frequentes
      </h2>
      <div className="flex flex-col gap-3">
        {faq.map((item, i) => (
          <FAQCard key={i} item={item} />
        ))}
      </div>
    </section>
  )
}
