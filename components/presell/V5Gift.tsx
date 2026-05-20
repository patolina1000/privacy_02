'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function V5Gift() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (loading) return
    setLoading(true)
    try { sessionStorage.setItem('mv_age_18', '1') } catch {}
    await new Promise(r => setTimeout(r, 500))
    const qs = typeof window !== 'undefined' ? window.location.search : ''
    router.push('/' + qs)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-5 py-8">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-7 text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={open}
            className={`w-24 h-24 mx-auto rounded-3xl bg-violet-50 flex items-center justify-center text-5xl mb-4 transition-all duration-300 ${
              open ? 'scale-110' : 'hover:scale-105 active:scale-95 animate-pulse'
            }`}
            aria-label="Abrir"
          >
            {open ? '🎉' : '🎁'}
          </button>
          <h1 className="text-slate-900 text-xl font-semibold mb-1.5">
            {open ? 'Tudo pronto' : 'Você tem um benefício'}
          </h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {open
              ? 'Continue para acessar o conteúdo.'
              : 'Toque na caixa para abrir.'}
          </p>
          {open && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-violet-200 transition-all disabled:opacity-70"
            >
              {loading ? 'Preparando…' : 'Continuar →'}
            </button>
          )}
          <p className="text-[11px] text-slate-400 mt-4">
            Acesso restrito a maiores de 18 anos.
          </p>
        </div>
      </div>
    </main>
  )
}
