'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { at: 30,  label: 'Verificando conexão' },
  { at: 65,  label: 'Carregando preferências' },
  { at: 100, label: 'Tudo pronto' },
]

export default function V2Loading() {
  const router = useRouter()
  const [p, setP] = useState(0)
  const done = p >= 100

  useEffect(() => {
    const id = setInterval(() => setP(v => Math.min(100, v + 2)), 50)
    return () => clearInterval(id)
  }, [])

  const status = STEPS.find(s => p <= s.at)?.label ?? 'Tudo pronto'

  function go() {
    try { sessionStorage.setItem('mv_age_18', '1') } catch {}
    router.push('/' + (typeof window !== 'undefined' ? window.location.search : ''))
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-7">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-violet-600 animate-spin" />
          </div>
          <h1 className="text-center text-slate-900 text-lg font-semibold mb-1">
            Preparando seu acesso
          </h1>
          <p className="text-center text-slate-500 text-sm mb-5">{status}</p>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-violet-600 rounded-full transition-all duration-100"
                 style={{ width: `${p}%` }} />
          </div>

          <button
            type="button"
            disabled={!done}
            onClick={go}
            className={`w-full rounded-2xl py-4 font-semibold text-sm transition-all ${
              done
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {done ? 'Continuar →' : `${p}%`}
          </button>

          <p className="text-center text-[11px] text-slate-400 mt-4">
            Acesso restrito a maiores de 18 anos.
          </p>
        </div>
      </div>
    </main>
  )
}
