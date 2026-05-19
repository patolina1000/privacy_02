'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Presell de verificação (estilo reCAPTCHA). Filtra tráfego barato sem
// cloaker pago. Não dispara nenhum evento de pixel — totalmente neutra.
// O lead verificado é redirecionado para /inicio, preservando UTMs.
export default function Presell() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [verifying, setVerifying] = useState(false)

  function gotoInicio() {
    try { localStorage.setItem('mv_verified', '1') } catch {}
    const qs = typeof window !== 'undefined' ? window.location.search : ''
    router.replace('/inicio' + qs)
  }

  // Se já verificou ou está preso no funil, pula a presell.
  useEffect(() => {
    try {
      if (localStorage.getItem('mv_verified') || localStorage.getItem('mv_upsell')) {
        const qs = typeof window !== 'undefined' ? window.location.search : ''
        router.replace('/inicio' + qs)
      }
    } catch {}
  }, [router])

  function toggleCheckbox() {
    if (checked || verifying) return
    setVerifying(true)
    // simula o spinner do reCAPTCHA
    setTimeout(() => { setChecked(true); setVerifying(false) }, 700)
  }

  function handleVerify() {
    if (verifying) return
    if (checked) { gotoInicio(); return }
    // se ainda não marcou, marca e avança automaticamente
    setVerifying(true)
    setTimeout(() => { setChecked(true); setVerifying(false); gotoInicio() }, 700)
  }

  return (
    <main className="flex justify-center min-h-screen bg-[#f5f5f5]">
      <div className="w-full max-w-[430px] bg-white shadow-xl relative overflow-hidden min-h-screen flex items-center justify-center px-4">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-md p-6 text-center">
            <h1 className="text-lg font-bold text-gray-900 mb-1">Verificação de segurança</h1>
            <p className="text-sm text-gray-500 mb-5">Marque a caixinha abaixo!</p>

            <button
              type="button"
              onClick={toggleCheckbox}
              disabled={checked || verifying}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between mb-4 active:scale-[0.99] transition-transform disabled:cursor-default"
            >
              <span className="text-sm text-gray-800">Sou maior de 18 anos</span>
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'bg-green-500 border-green-500' : 'border-blue-400'}`}>
                  {verifying && !checked && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="28 56" />
                    </svg>
                  )}
                  {checked && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">reCAPTCHA</span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white font-bold py-3.5 rounded-xl tracking-wide transition-colors disabled:opacity-70"
            >
              VERIFICAR E ASSISTIR
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
