import type { Metadata, Viewport } from 'next'
import './globals.css'
import Tracking from '@/components/Tracking'

export const metadata: Metadata = {
  title: 'Nayara Assunção — Conteúdo Exclusivo',
  description: 'Acesse conteúdo exclusivo e privado.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f5f5f5] min-h-screen">
        {/* Pixel TikTok + ViewContent só carregam fora das rotas neutras
            (bridge / preview). Decisão em components/Tracking.tsx */}
        <Tracking pixelId={process.env.TIKTOK_PIXEL_ID || ''} />
        {children}
      </body>
    </html>
  )
}
