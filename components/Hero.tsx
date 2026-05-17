'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import VerifiedIcon from './icons/VerifiedIcon'
import HeartIcon from './icons/HeartIcon'
import { ModelConfig, StatsConfig } from '@/types/site'

interface Props {
  model: ModelConfig
  stats: StatsConfig
}

export default function Hero({ model, stats }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const isBannerVideo = model.banner.endsWith('.mp4') || model.banner.endsWith('.webm')

  const AVATAR_SIZE = 107 // px — metade vai pra dentro do banner, metade fica abaixo

  return (
    <section className="relative">

      {/* ── BANNER ── */}
      <div className="relative w-full bg-gray-900 overflow-visible" style={{ aspectRatio: '4/3' }}>
        {isBannerVideo ? (
          <video
            ref={videoRef}
            src={model.banner}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none' }}
          />
        ) : (
          <Image
            src={model.banner}
            alt="Banner"
            fill sizes="430px"
            className="object-cover object-top"
            priority
          />
        )}

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45 pointer-events-none" />

        {/* Stats — canto inferior direito, acima do avatar */}
        <div className="absolute bottom-3 right-3 flex items-center gap-3 text-white text-xs font-semibold drop-shadow z-10">
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 640 640" className="w-4 h-4" fill="none">
              <path
                d="M160 144C151.2 144 144 151.2 144 160L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 160C496 151.2 488.8 144 480 144L160 144zM96 160C96 124.7 124.7 96 160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160zM224 192C241.7 192 256 206.3 256 224C256 241.7 241.7 256 224 256C206.3 256 192 241.7 192 224C192 206.3 206.3 192 224 192zM360 264C368.5 264 376.4 268.5 380.7 275.8L460.7 411.8C465.1 419.2 465.1 428.4 460.8 435.9C456.5 443.4 448.6 448 440 448L200 448C191.1 448 182.8 443 178.7 435.1C174.6 427.2 175.2 417.6 180.3 410.3L236.3 330.3C240.8 323.9 248.1 320.1 256 320.1C263.9 320.1 271.2 323.9 275.7 330.3L292.9 354.9L339.4 275.9C343.7 268.6 351.6 264.1 360.1 264.1z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
            {stats.photos}
          </span>
          <span className="flex items-center gap-1">
            <svg viewBox="0 0 640 640" className="w-4 h-4" fill="none">
              <path
                d="M128 128C92.7 128 64 156.7 64 192L64 448C64 483.3 92.7 512 128 512L384 512C419.3 512 448 483.3 448 448L448 192C448 156.7 419.3 128 384 128L128 128zM496 400L569.5 458.8C573.7 462.2 578.9 464 584.3 464C597.4 464 608 453.4 608 440.3L608 199.7C608 186.6 597.4 176 584.3 176C578.9 176 573.7 177.8 569.5 181.2L496 240L496 400z"
                fill="white"
                fillOpacity="0.9"
              />
            </svg>
            {stats.videos}
          </span>
          <span className="flex items-center gap-1">
            <HeartIcon className="w-4 h-4 text-white/90" />
            {stats.likes}
          </span>
        </div>

        {/* Avatar — ancorado na borda inferior do banner, metade para fora */}
        <div
          className="absolute left-4 z-20"
          style={{ bottom: -(AVATAR_SIZE / 2) }}
        >
          <div
            className="rounded-full p-[3px] shadow-lg"
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, backgroundColor: '#E00000' }}
          >
            <div className="w-full h-full rounded-full p-[2.5px] bg-white">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                <Image
                  src={model.avatar}
                  alt={model.name}
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTEÚDO ABAIXO DO BANNER ── */}
      <div className="px-4 pb-4">

        {/* Linha com avatar/badge à esquerda e nome/@ à direita */}
        <div className="flex gap-3 py-1">
          <div
            className="flex flex-col items-center flex-shrink-0"
            style={{ width: AVATAR_SIZE }}
          >
            <div aria-hidden="true" className="w-full" />

            {model.liveNow && (
              <div style={{ paddingTop: AVATAR_SIZE / 3 + 4}}>
                <div className="text-gray-300 text-[8px] font-extrabold px-2 py-[3px] whitespace-nowrap inline-flex items-center justify-center gap-1 leading-none shadow w-fit mx-auto" style={{ backgroundColor: '#E00000', borderRadius: '0.2rem' }}>
                  <span className="w-1 h-1 bg-white rounded-full animate-pulse shrink-0" style={{opacity: 0.6}}/>
                  <span className="">AO VIVO AGORA</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-1">
              <h1 className="text-[15px] font-extrabold text-gray-900 leading-tight">{model.name}</h1>
              {model.verified && <VerifiedIcon className="w-4 h-4 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-500 leading-tight">{model.username}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="">
          <div className="relative">
            <p className={`text-xs text-gray-500 ${bioExpanded ? 'leading-relaxed' : 'leading-[1.3] line-clamp-3'}`}>
              {model.bio}
            </p>
            {!bioExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent" />
            )}
          </div>
          <button
            onClick={() => setBioExpanded(!bioExpanded)}
            className="text-sm text-gray-900"
          >
            {bioExpanded ? 'Mostrar menos' : 'Mostrar mais'}
          </button>
        </div>
      </div>
    </section>
  )
}
