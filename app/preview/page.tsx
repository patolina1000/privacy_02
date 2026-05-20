import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Preview · Variantes' }

const VARIANTS = [
  { slug: 'v1-idade',   title: 'V1 · Idade + Continuar',  desc: 'Checkbox 18+ + CTA. Default recomendado.' },
  { slug: 'v2-loading', title: 'V2 · Loading / Preparar', desc: 'Auto-progresso com mensagens e CTA no fim.' },
  { slug: 'v3-unlock',  title: 'V3 · Slide to unlock',    desc: 'Gesto mobile clássico, alto CTR.' },
  { slug: 'v4-data',    title: 'V4 · Data de nascimento', desc: 'Verificação real (Lei Felca).' },
  { slug: 'v5-gift',    title: 'V5 · Gift box',           desc: 'Gamificado — use com cuidado.' },
]

export default function PreviewIndex() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Preview · Bridge pages</h1>
        <p className="text-slate-500 text-sm mb-6">Toque numa variante pra abrir. Após confirmar, cada uma redireciona pra <code className="text-violet-600">/</code> (sua landing real).</p>
        <div className="grid gap-3">
          {VARIANTS.map(v => (
            <Link
              key={v.slug}
              href={`/preview/${v.slug}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-400 hover:shadow-md transition-all"
            >
              <div className="font-semibold text-slate-900">{v.title}</div>
              <div className="text-sm text-slate-500 mt-1">{v.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
