'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function V1Idade() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (loading || !checked) return
    setLoading(true)
    try { sessionStorage.setItem('mv_age_18', '1') } catch {}
    await new Promise(r => setTimeout(r, 800))
    const qs = typeof window !== 'undefined' ? window.location.search : ''
    router.push('/' + qs)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-5 py-8">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100 p-7">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-slate-700">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v4h8z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <h1 className="text-center text-slate-900 text-xl font-semibold mb-1.5 tracking-tight">
            Confirmar acesso
          </h1>
          <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">
            Conteúdo restrito a maiores de 18 anos.
          </p>

          <button
            type="button"
            onClick={() => setChecked(v => !v)}
            disabled={loading}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl px-4 py-4 flex items-center gap-3 mb-3 transition-colors active:scale-[0.995] disabled:opacity-60"
          >
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300 bg-white'
            }`}>
              {checked && (
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-slate-700 text-sm text-left">
              Confirmo que tenho 18 anos ou mais
            </span>
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!checked || loading}
            aria-busy={loading}
            className={`w-full rounded-2xl py-4 font-semibold text-sm tracking-wide transition-all ${
              checked && !loading
                ? 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white shadow-lg shadow-violet-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeDasharray="28 56"/>
                </svg>
                Preparando acesso…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                Continuar
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
            Ao continuar, você concorda com os{' '}
            <a href="#" className="text-slate-500 underline">termos</a> e a{' '}
            <a href="#" className="text-slate-500 underline">privacidade</a>.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mt-5 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#94a3b8"/>
            </svg>
            Conexão segura
          </span>
          <span>•</span>
          <span>+18</span>
        </div>
      </div>
    </main>
  )
}
