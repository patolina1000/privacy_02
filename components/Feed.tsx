'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import LockIcon from './icons/LockIcon'
import HeartIcon from './icons/HeartIcon'
import CommentIcon from './icons/CommentIcon'
import BookmarkIcon from './icons/BookmarkIcon'
import { FeedItem, StatsConfig, ModelConfig } from '@/types/site'

interface Props {
  feed: FeedItem[]
  stats: StatsConfig
  model: ModelConfig
}

function FeedCard({ item, model }: { item: FeedItem; model: ModelConfig }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = item.type === 'video'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden mb-3 shadow-sm"
    >
      {/* Post header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          <Image src={model.avatar} alt={model.name} width={36} height={36} className="object-cover w-full h-full" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{model.name}</p>
          <p className="text-xs text-gray-400">{model.username}</p>
        </div>
      </div>

      {/* Media */}
      <div className="relative w-full aspect-[3/4] bg-gray-900 overflow-hidden">
        {isVideo ? (
          <video
            ref={videoRef}
            src={item.src}
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover ${item.blur ? 'blur-xl scale-110' : ''}`}
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <Image
            src={item.src}
            alt="Conteúdo exclusivo"
            fill
            className={`object-cover ${item.blur ? 'blur-xl scale-110' : ''}`}
          />
        )}

        {/* Lock overlay */}
        {item.blur && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <LockIcon className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        )}

        {/* Stats on image */}
        <div className="bg-black/50 backdrop-blur-sm rounded-full absolute bottom-3 left-3 flex items-center gap-0 text-white text-xs font-semibold px-1 py-2">
          <span className="px-2 flex items-center gap-1">
            <HeartIcon className="w-3.5 h-3.5" />
            {item.likes}
          </span>
          <span className="px-2 flex items-center gap-1">
            <CommentIcon className="w-3.5 h-3.5" />
            {item.comments}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 items-center px-4 py-3">
        <button className="inline-flex items-center justify-center text-gray-400 active:text-red-500 transition-colors">
          <HeartIcon className="w-5 h-5" />
        </button>
        <button className="inline-flex items-center justify-center text-gray-400 active:text-[#ff6b1a] transition-colors">
          <CommentIcon className="w-5 h-5" />
        </button>
        <button className="inline-flex items-center justify-center text-gray-400 active:text-[#ff6b1a] transition-colors">
          <BookmarkIcon className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default function Feed({ feed, stats, model }: Props) {
  return (
    <section className="px-4 py-4">
      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 mb-4 py-3">
        <div className="text-center text-gray-500">
          <span className="text-sm">{stats.posts}</span>
          <span className="text-xs"> Posts</span>
        </div>
        <span className="text-gray-500">•</span>
        <div className="text-center text-[#ff6b1a]">
          <span className="text-sm">{stats.videos}</span>
          <span className="text-xs"> Videos</span>
        </div>
        <span className="text-gray-500">•</span>
        <div className="text-center text-gray-500">
          <span className="text-sm">{stats.photos}</span>
          <span className="text-xs"> Fotos</span>
        </div>
      </div>

      {/* Feed cards */}
      {feed.map((item) => (
        <FeedCard key={item.id} item={item} model={model} />
      ))}
    </section>
  )
}
