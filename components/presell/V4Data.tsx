'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function V4Data() {
  const router = useRouter()
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')
  const [blocked, setBlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  function submit() {
    setErr('')
    const day = +d, mon = +m, yr = +y
    if (!day || !mon || !yr || yr < 1900 || yr > 2100) { setErr('Informe uma data válida.'); return }
    const dob = new Date(yr, mon - 1, day)
    if (Number.isNaN(dob.getTime())) { setErr('Informe uma data válida.'); return }
    const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
    if (age < 18) { setBlocked(true); return }
    setLoading(true)
    try { sessionStorage.setItem('mv_age_18', '1') } catch {}
    setTimeout(() => {
      const qs = typeof window !== 'undefined' ? window.location.search : ''
      router.push('/' + qs)
    }, 500)
  }

  if (blocked) return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-slate-500">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-slate-900 text-xl font-semibold mb-2">Acesso indisponível</h1>
        <p className="text-slate-500 text-sm">Este conteúdo é restrito a maiores de 18 anos.</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-5 py-8">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-7">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-slate-700">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M16 3v4M8 3v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-center text-slate-900 text-xl font-semibold mb-1">
            Verificação de idade
          </h1>
          <p className="text-center text-slate-500 text-sm mb-5">
            Informe sua data de nascimento
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input inputMode="numeric" maxLength={2} placeholder="DD" value={d}
              onChange={e => setD(e.target.value.replace(/\D/g, ''))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-slate-900 outline-none focus:border-violet-500"/>
            <input inputMode="numeric" maxLength={2} placeholder="MM" value={m}
              onChange={e => setM(e.target.value.replace(/\D/g, ''))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-slate-900 outline-none focus:border-violet-500"/>
            <input inputMode="numeric" maxLength={4} placeholder="AAAA" value={y}
              onChange={e => setY(e.target.value.replace(/\D/g, ''))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-slate-900 outline-none focus:border-violet-500"/>
          </div>
          {err && <p className="text-xs text-red-500 text-center mb-2">{err}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-violet-200 mt-2 disabled:opacity-70">
            {loading ? 'Verificando…' : 'Continuar'}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-4">
            Acesso restrito a maiores de 18 anos.
          </p>
        </div>
      </div>
    </main>
  )
}
