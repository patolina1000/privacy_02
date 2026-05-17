'use client'

import { useState, useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/tiktok-pixel'
import { trackFunnel } from '@/lib/funnel'

interface Props {
  onClose: () => void
}

type FunnelStep = 'upsell1' | 'upsell2' | 'final'
type QrStep = 'offer' | 'loading' | 'qr'

interface PixData {
  id: string
  pix_copia_cola: string
}

const VIP_URL =
  process.env.NEXT_PUBLIC_VIP_GROUP_URL ?? 'https://t.me/liberarconteudoverificadobot'

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',')
}

function useCountdown(initial: number) {
  const [t, setT] = useState(initial)
  useEffect(() => {
    const id = setInterval(() => setT((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const m = String(Math.floor(t / 60)).padStart(2, '0')
  const s = String(t % 60).padStart(2, '0')
  return `${m}:${s}`
}

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 flex-shrink-0">
    <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Shield = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#22c55e" />
  </svg>
)

export default function UpsellFunnel({ onClose }: Props) {
  const [funnel, setFunnel] = useState<FunnelStep>('upsell1')
  const [qrStep, setQrStep] = useState<QrStep>('offer')
  const [extra1, setExtra1] = useState(false)
  const [extra2, setExtra2] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdown = useCountdown(5 * 60)

  const u1Total = 6.5 + (extra1 ? 7 : 0)
  const u2Total = 12.53 + (extra2 ? 14 : 0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // Conta quantos leads chegam em cada etapa do funil de upsell.
  // funnel só avança (upsell1 → upsell2 → final), então cada valor
  // dispara uma vez.
  useEffect(() => {
    if (funnel === 'upsell1') trackFunnel('upsell1_view')
    else if (funnel === 'upsell2') trackFunnel('upsell2_view')
    else if (funnel === 'final') trackFunnel('funnel_complete')
  }, [funnel])

  useEffect(() => {
    if (qrStep !== 'qr' || !pixData) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?id=${pixData.id}`)
        const d = await res.json()
        if (d.status === 'paid') {
          clearInterval(pollRef.current!)

          // Purchase separado para cada taxa
          const isU1 = funnel === 'upsell1'
          trackEvent({
            event: 'Purchase',
            value: isU1 ? u1Total : u2Total,
            content_id: isU1 ? 'upsell-verificacao' : 'upsell-liberacao',
            content_name: isU1 ? 'Verificação Obrigatória' : 'Taxa de Liberação de Uso',
            order_id: pixData?.id,
          })
          trackFunnel(isU1 ? 'upsell1_paid' : 'upsell2_paid')

          if (funnel === 'upsell1') { setFunnel('upsell2'); setQrStep('offer'); setPixData(null) }
          else if (funnel === 'upsell2') { setFunnel('final'); setQrStep('offer'); setPixData(null) }
        }
      } catch {}
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [qrStep, pixData, funnel])

  async function pay(amount: number, description: string) {
    setQrStep('loading')
    try {
      const res = await fetch('/api/pix/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, external_id: `up-${Date.now()}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      setPixData({ id: data.transaction.id, pix_copia_cola: data.transaction.pix_copia_cola })
      setQrStep('qr')

      // InitiateCheckout para cada taxa
      const isU1 = funnel === 'upsell1'
      trackEvent({
        event: 'InitiateCheckout',
        value: amount,
        content_id: isU1 ? 'upsell-verificacao' : 'upsell-liberacao',
        content_name: description,
        order_id: data.transaction.id,
      })
    } catch {
      setQrStep('offer')
    }
  }

  function copy() {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.pix_copia_cola)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const TimerBar = ({ label }: { label: string }) => (
    <div className="bg-[#1a1f2e] px-4 py-2.5 flex items-center justify-between">
      <span className="text-white/70 text-xs flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
          <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
          <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {label}
      </span>
      <span className="text-pink-400 font-bold text-sm">{countdown}</span>
      <button onClick={onClose} className="text-white/50 hover:text-white text-xl leading-none">×</button>
    </div>
  )

  const QRScreen = ({ accentClass }: { accentClass: string }) => (
    <div className="bg-white px-5 pt-5 pb-5">
      <div className="flex justify-center mb-4">
        <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
          <img
            src={`/api/pix/qr?id=${pixData!.id}`}
            alt="QR Code PIX"
            className="w-44 h-44 object-contain"
          />
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl px-3 py-2.5 mb-3 bg-gray-50">
        <p className="text-[11px] text-gray-500 text-center break-all leading-relaxed line-clamp-3">
          {pixData!.pix_copia_cola}
        </p>
      </div>
      <button
        onClick={copy}
        className="w-full border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all mb-3"
      >
        {copied
          ? <span className="text-green-600">✓ Copiado!</span>
          : 'Copiar código PIX'}
      </button>
      <div className="flex items-center justify-center gap-2">
        <svg className={`w-5 h-5 animate-spin ${accentClass}`} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="28 56" />
        </svg>
        <span className={`text-sm font-bold ${accentClass}`}>Aguardando pagamento...</span>
      </div>
    </div>
  )

  const Footer = () => (
    <div className="flex items-center justify-center gap-6 mt-3">
      <span className="flex items-center gap-1.5 text-xs text-gray-500"><Shield />Pagamento seguro</span>
      <span className="flex items-center gap-1.5 text-xs text-gray-500"><Shield />Dados protegidos</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-[390px] rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ── UPSELL 1: Verificação Obrigatória ── */}
        {funnel === 'upsell1' && (
          <>
            <TimerBar label="Tempo restante para liberação:" />
            <div className="bg-gradient-to-r from-green-600 to-green-400 px-5 pt-4 pb-4 text-center">
              <p className="text-3xl mb-1">🛡️</p>
              <h2 className="text-white text-lg font-black mb-0.5">Verificação Obrigatória</h2>
              <p className="text-white/80 text-xs">Tarifa de Segurança do Dispositivo</p>
            </div>

            {qrStep === 'qr'
              ? <QRScreen accentClass="text-green-500" />
              : (
                <div className="bg-white px-5 pt-4 pb-5">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    Seu pagamento foi <strong>confirmado com sucesso</strong>!<br />
                    Para garantir a <strong>segurança e exclusividade</strong> do conteúdo, precisamos
                    verificar seu dispositivo. Essa tarifa impede acessos não autorizados e protege
                    contra vazamentos.
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {['Vincula seu dispositivo ao acesso VIP', 'Protege contra clonagem e vazamento', 'Verificação instantânea e automática'].map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700"><Check />{b}</li>
                    ))}
                  </ul>
                  <p className="text-center font-black text-green-500 text-4xl mb-3">R$ {fmt(u1Total)}</p>
                  <div className="border border-green-200 bg-green-50 rounded-xl px-3 py-2 mb-3 text-center">
                    <p className="text-xs text-green-700 font-semibold">⚠ Sem esta verificação, seu acesso não será liberado.</p>
                  </div>
                  <div className="relative mb-3">
                    <span className="absolute -top-2.5 left-3 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                      Oferta especial
                    </span>
                    <label
                      className="flex items-center gap-3 border-2 border-dashed border-green-400 rounded-xl px-3 pt-4 pb-3 bg-green-50 cursor-pointer"
                      onClick={() => setExtra1(!extra1)}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${extra1 ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                        {extra1 && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">💬 Meu WhatsApp Pessoal</p>
                        <p className="text-sm font-black text-green-500 leading-tight">+ R$ 7,00</p>
                        <p className="text-[11px] text-gray-500 leading-tight">Converse comigo diretamente no WhatsApp</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-center text-sm text-gray-600 mb-3">
                    Total: <span className="font-black text-gray-900">R$ {fmt(u1Total)}</span>
                  </p>
                  <button
                    onClick={() => pay(u1Total, 'Verificação Obrigatória')}
                    disabled={qrStep === 'loading'}
                    className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
                  >
                    {qrStep === 'loading' ? 'Gerando PIX...' : `🔒 Liberar dispositivo por R$ ${fmt(u1Total)}`}
                  </button>
                  <Footer />
                </div>
              )
            }
          </>
        )}

        {/* ── UPSELL 2: Última Etapa ── */}
        {funnel === 'upsell2' && (
          <>
            <TimerBar label="Tempo restante:" />
            <div className="bg-gradient-to-r from-pink-600 to-pink-400 px-5 pt-4 pb-4 text-center">
              <p className="text-3xl mb-1">⬇️</p>
              <h2 className="text-white text-lg font-black mb-0.5">Última Etapa</h2>
              <p className="text-white/80 text-xs">Taxa de Liberação de Uso</p>
            </div>

            {qrStep === 'qr'
              ? <QRScreen accentClass="text-pink-500" />
              : (
                <div className="bg-white px-5 pt-4 pb-5">
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    Dispositivo <strong>verificado com sucesso</strong>!<br />
                    Esta é a <strong>última etapa</strong> e o <strong>último pagamento</strong>. A Taxa de
                    Liberação de Uso garante seu direito de acessar e baixar todo o conteúdo exclusivo
                    do canal VIP.
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {['Liberação completa de downloads', 'Acesso sem restrições ao conteúdo', 'Direito de uso pessoal das mídias'].map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700"><Check />{b}</li>
                    ))}
                  </ul>
                  <p className="text-center font-black text-pink-500 text-4xl mb-3">R$ {fmt(u2Total)}</p>
                  <div className="border border-pink-200 bg-pink-50 rounded-xl px-3 py-2 mb-3 text-center">
                    <p className="text-xs text-pink-700 font-semibold">⚠ Esta é a última etapa. Após isso, acesso total liberado.</p>
                  </div>
                  <div className="relative mb-3">
                    <span className="absolute -top-2.5 left-3 bg-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                      Oferta especial
                    </span>
                    <label
                      className="flex items-center gap-3 border-2 border-dashed border-pink-400 rounded-xl px-3 pt-4 pb-3 bg-pink-50 cursor-pointer"
                      onClick={() => setExtra2(!extra2)}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${extra2 ? 'bg-pink-500 border-pink-500' : 'border-gray-300 bg-white'}`}>
                        {extra2 && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">🎁 Minha Calcinha Usada</p>
                        <p className="text-sm font-black text-pink-500 leading-tight">+ R$ 14,00</p>
                        <p className="text-[11px] text-gray-500 leading-tight">Enviada na hora, discreta e bem molhadinha</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-center text-sm text-gray-600 mb-3">
                    Total: <span className="font-black text-gray-900">R$ {fmt(u2Total)}</span>
                  </p>
                  <button
                    onClick={() => pay(u2Total, 'Taxa de Liberação de Uso')}
                    disabled={qrStep === 'loading'}
                    className="w-full bg-gradient-to-r from-pink-600 to-pink-400 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
                  >
                    {qrStep === 'loading' ? 'Gerando PIX...' : 'Ativar liberação de uso ✅'}
                  </button>
                  <Footer />
                </div>
              )
            }
          </>
        )}

        {/* ── FINAL: Acesso Liberado ── */}
        {funnel === 'final' && (
          <>
            <div className="relative bg-gradient-to-br from-teal-500 to-green-400 px-5 pt-8 pb-6 text-center">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-black mb-1">Acesso Liberado!</h2>
              <p className="text-white/80 text-sm">Todas as verificações foram concluídas</p>
            </div>
            <div className="bg-white px-5 py-6 text-center">
              <p className="text-sm text-gray-600 mb-5">
                Parabéns! Seu acesso completo está liberado. Clique no botão abaixo para entrar no grupo VIP.
              </p>
              <a
                href={VIP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-teal-500 to-green-400 text-white font-black text-base py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
              >
                ✈ Entrar no Grupo VIP
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
