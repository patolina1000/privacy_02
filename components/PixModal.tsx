'use client'

import { useState, useEffect, useRef } from 'react'
import { PlanConfig } from '@/types/site'
import { trackEvent } from '@/lib/tiktok-pixel'

interface Props {
  plan: PlanConfig
  onClose: () => void
  onPaid?: () => void
}

const VIDEO_CALL_PRICE = 7.00

function parsePrice(price: string): number {
  return parseFloat(price.replace(',', '.'))
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

type Step = 'form' | 'loading' | 'qr' | 'paid'

interface PixData {
  id: string
  pix_copia_cola: string
}

export default function PixModal({ plan, onClose, onPaid }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [withVideoCall, setWithVideoCall] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const base = parsePrice(plan.price)
  const total = base + (withVideoCall ? VIDEO_CALL_PRICE : 0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Poll payment status every 3s after QR is shown
  useEffect(() => {
    if (step !== 'qr' || !pixData) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?id=${pixData.id}`)
        const data = await res.json()
        if (data.status === 'paid') {
          clearInterval(pollRef.current!)

          // Purchase: pagamento confirmado
          trackEvent({
            event: 'Purchase',
            email,
            name,
            value: total,
            content_id: plan.id || 'plan',
            content_name: plan.title,
            order_id: pixData?.id,
          })

          if (onPaid) { onClose(); onPaid() } else { setStep('paid') }
        }
      } catch {}
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step, pixData])

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Preencha nome e e-mail para continuar.')
      return
    }
    setError('')
    setStep('loading')

    try {
      const external_id = `${plan.id}-${Date.now()}`
      const res = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          description: `${plan.title} — ${name}`,
          external_id,
        }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX')

      setPixData({
        id: data.transaction.id,
        pix_copia_cola: data.transaction.pix_copia_cola,
      })
      setStep('qr')

      // InitiateCheckout: PIX gerado com sucesso
      trackEvent({
        event: 'InitiateCheckout',
        email,
        name,
        value: total,
        content_id: plan.id || 'plan',
        content_name: plan.title,
        order_id: data.transaction.id,
      })
    } catch (e: any) {
      setError(e.message || 'Erro ao gerar PIX. Tente novamente.')
      setStep('form')
    }
  }

  function copyPix() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.pix_copia_cola)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const header = (title: string, subtitle: string) => (
    <div className="relative bg-gradient-to-r from-[#e85c00] to-[#f57322] px-5 pt-5 pb-4 text-center">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
      <h2 className="text-white text-lg font-black mb-0.5">{title}</h2>
      <p className="text-white/80 text-xs mb-2.5">{subtitle}</p>
      <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full">
        {plan.title} — R$ {formatPrice(total)}
      </span>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[390px] rounded-3xl overflow-hidden shadow-2xl">

        {/* ── STEP: FORM ── */}
        {(step === 'form' || step === 'loading') && (
          <>
            {header('Pagamento via PIX', 'Preencha seus dados para gerar o PIX')}

            <div className="bg-white px-5 pt-4 pb-5">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-800 mb-1">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome e sobrenome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={step === 'loading'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#ff6b1a] transition-colors disabled:opacity-50"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-800 mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === 'loading'}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#ff6b1a] transition-colors disabled:opacity-50"
                />
              </div>

              {/* Oferta especial */}
              <div className="relative mb-3">
                <span className="absolute -top-2.5 left-3 bg-[#ff6b1a] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                  Oferta especial
                </span>
                <label
                  className="flex items-center gap-3 border-2 border-dashed border-[#ff6b1a] rounded-xl px-3 pt-4 pb-3 bg-orange-50 cursor-pointer"
                  onClick={() => step === 'form' && setWithVideoCall(!withVideoCall)}
                >
                  <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${withVideoCall ? 'bg-[#ff6b1a] border-[#ff6b1a]' : 'border-gray-300 bg-white'}`}>
                    {withVideoCall && (
                      <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">📹 Chamada de Vídeo Privada</p>
                    <p className="text-sm font-black text-[#ff6b1a] leading-tight">+ R$ 7,00</p>
                    <p className="text-[11px] text-gray-500 leading-tight">Sessão exclusiva de 10 min ao vivo, só nós dois</p>
                  </div>
                </label>
              </div>

              <p className="text-center text-sm text-gray-600 mb-2">
                Total: <span className="font-black text-gray-900">R$ {formatPrice(total)}</span>
              </p>

              {error && <p className="text-center text-xs text-red-500 mb-2">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={step === 'loading'}
                className="w-full bg-gradient-to-r from-[#ff6b1a] to-[#ff8c42] text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {step === 'loading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                    </svg>
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8"/>
                      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8"/>
                      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="white" strokeWidth="1.8"/>
                      <rect x="5" y="5" width="4" height="4" rx="0.5" fill="white"/>
                      <rect x="15" y="5" width="4" height="4" rx="0.5" fill="white"/>
                      <rect x="5" y="15" width="4" height="4" rx="0.5" fill="white"/>
                      <rect x="13" y="13" width="2" height="2" fill="white"/>
                      <rect x="17" y="13" width="2" height="2" fill="white"/>
                      <rect x="13" y="17" width="2" height="2" fill="white"/>
                      <rect x="17" y="17" width="4" height="4" rx="0.5" fill="white"/>
                    </svg>
                    Gerar PIX
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-6 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#22c55e"/></svg>
                  Pagamento seguro
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#22c55e"/></svg>
                  Dados protegidos
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── STEP: QR CODE ── */}
        {step === 'qr' && pixData && (
          <>
            {header('Escaneie o QR Code', 'Ou copie o código PIX abaixo')}

            <div className="bg-white px-5 pt-5 pb-5">
              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
                  <img
                    src={`/api/pix/qr?id=${pixData.id}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              {/* Copia e cola */}
              <div className="border border-gray-200 rounded-xl px-3 py-2.5 mb-3 bg-gray-50">
                <p className="text-[11px] text-gray-500 text-center break-all leading-relaxed line-clamp-3">
                  {pixData.pix_copia_cola}
                </p>
              </div>

              {/* Botão copiar */}
              <button
                onClick={copyPix}
                className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all mb-4"
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-green-500">
                      <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-green-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="#555" strokeWidth="1.8"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                    Copiar código PIX
                  </>
                )}
              </button>

              {/* Aguardando */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-5 h-5 animate-spin text-[#ff6b1a]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#ff6b1a" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="28 56"/>
                </svg>
                <span className="text-sm font-bold text-[#ff6b1a]">Aguardando pagamento...</span>
              </div>

              <div className="flex items-center justify-center gap-6">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#22c55e"/></svg>
                  Pagamento seguro
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M5 12h14M12 5l7 7-7 7" stroke="#ff6b1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Confirmação automática
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── STEP: PAID ── */}
        {step === 'paid' && (
          <>
            <div className="relative bg-gradient-to-r from-green-500 to-green-400 px-5 pt-5 pb-4 text-center">
              <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </button>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="text-white text-lg font-black mb-0.5">Pagamento confirmado!</h2>
              <p className="text-white/80 text-xs">Seu acesso será liberado em instantes.</p>
            </div>
            <div className="bg-white px-5 py-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Verifique seu e-mail <span className="font-bold text-gray-900">{email}</span> para os dados de acesso.</p>
              <button onClick={onClose} className="w-full bg-green-500 text-white font-black py-3.5 rounded-2xl text-sm">
                Fechar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
