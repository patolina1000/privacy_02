'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { TestimonialItem } from '@/types/site'

interface Props {
  testimonials: TestimonialItem[]
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <div className="flex-shrink-0 w-[200px] bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-3 border-2 border-gray-100">
        <Image
          src={item.avatar}
          alt={item.name}
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      </div>
      <p className="text-sm font-bold text-gray-900 mb-2">{item.name}</p>
      <p className="text-xs text-gray-500 leading-relaxed">"{item.quote}"</p>
    </div>
  )
}

export default function Testimonials({ testimonials }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section className="py-5 bg-[#f5f5f5] border-t border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 px-4 mb-4 text-center">
        📢 O que estão dizendo...
      </h2>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {testimonials.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="snap-start"
          >
            <TestimonialCard item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
