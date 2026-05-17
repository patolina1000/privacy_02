'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SocialProofConfig } from '@/types/site'

interface Props {
  config: SocialProofConfig
}

export default function SocialProof({ config }: Props) {
  const [notif, setNotif] = useState<null | { name: string; action: string; plan: string; minutesAgo: number }>(null)
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNext = useCallback(() => {
    const idx = Math.floor(Math.random() * config.notifications.length)
    const minutesAgo = Math.floor(Math.random() * 9) + 1

    setNotif({ ...config.notifications[idx], minutesAgo })
    setVisible(true)

    // hide after 4s
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
    }, 4000)

    // schedule next: 7–10s after this one appears
    const nextDelay = Math.floor(Math.random() * 3000) + 7000
    if (nextTimer.current) clearTimeout(nextTimer.current)
    nextTimer.current = setTimeout(showNext, nextDelay)
  }, [config.notifications])

  useEffect(() => {
    // first popup after 2.5s
    const initial = setTimeout(showNext, 2500)
    return () => {
      clearTimeout(initial)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      if (nextTimer.current) clearTimeout(nextTimer.current)
    }
  }, [showNext])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-4 z-50 pointer-events-none">
      <AnimatePresence>
        {visible && notif && (
          <motion.div
            key={notif.name + notif.minutesAgo}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="bg-[#fff4ee] rounded-2xl shadow-2xl border border-[#f5a87a] px-4 py-3 flex items-center gap-3"
          >
            {/* Orange live dot */}
            <div className="flex-shrink-0 w-2.5 h-2.5 bg-[#ff6b1a] rounded-full animate-pulse" />

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">
                <span className="font-bold">{notif.name}</span>{' '}
                <span className="text-gray-600">{notif.action}</span>{' '}
                <span className="font-bold text-[#d94e00]">{notif.plan}</span>
              </p>
              <p className="text-xs text-[#b86030] mt-0.5">há {notif.minutesAgo} minutos</p>
            </div>

            <button
              className="pointer-events-auto flex-shrink-0 w-6 h-6 flex items-center justify-center text-[#c47040] hover:text-[#a05020] text-xl leading-none"
              onClick={() => {
                setVisible(false)
                if (hideTimer.current) clearTimeout(hideTimer.current)
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
