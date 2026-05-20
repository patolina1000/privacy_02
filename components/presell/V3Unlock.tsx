'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TRACK = 320
const THUMB = 56
const MAX = TRACK - THUMB

export default function V3Unlock() {
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  function start() { if (!unlocked) setDragging(true) }

  function move(clientX: number) {
    if (!dragging || !trackRef.current) return
    const left = trackRef.current.getBoundingClientRect().left
    setX(Math.max(0, Math.min(MAX, clientX - left - THUMB / 2)))
  }

  function end() {
    if (!dragging) return
    setDragging(false)
    if (x >= MAX - 8) {
      setUnlocked(true)
      setX(MAX)
      try { sessionStorage.setItem('mv_age_18', '1') } catch {}
      setTimeout(() => {
        const qs = typeof window !== 'undefined' ? window.location.search : ''
        router.push('/' + qs)
      }, 350)
    } else {
      setX(0)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-5">
      <div className="w-full max-w-[400px] text-center">
        <h1 className="text-white text-xl font-semibold mb-1">Acesso restrito</h1>
        <p className="text-slate-400 text-sm mb-8">Maiores de 18 anos</p>

        <div
          ref={trackRef}
          onTouchMove={(e) => move(e.touches[0].clientX)}
          onTouchEnd={end}
          onMouseMove={(e) => move(e.clientX)}
          onMouseUp={end}
          onMouseLeave={end}
          className="mx-auto relative h-14 rounded-full bg-white/10 border border-white/15 backdrop-blur"
          style={{ width: TRACK }}
        >
          <span className="absolute inset-0 flex items-center justify-center text-white/60 text-sm select-none pointer-events-none">
            {unlocked ? 'Liberando…' : 'Deslize para continuar'}
          </span>
          <button
            type="button"
            onMouseDown={start}
            onTouchStart={start}
            style={{ transform: `translateX(${x}px)`, transition: dragging ? 'none' : 'transform 200ms' }}
            className="absolute top-1 left-1 h-12 w-12 rounded-full bg-white shadow-lg flex items-center justify-center touch-none"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-slate-700">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-6">Ao continuar você confirma que tem 18+</p>
      </div>
    </main>
  )
}
