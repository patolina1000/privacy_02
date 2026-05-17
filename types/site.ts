export interface PromoConfig {
  enabled: boolean
  text: string
}

export interface ModelConfig {
  name: string
  username: string
  avatar: string
  banner: string
  bannerFallback: string
  bio: string
  verified: boolean
  liveNow: boolean
}

export interface StatsConfig {
  posts: number
  videos: number
  photos: number
  likes: string
}

export interface PlanConfig {
  id: string
  title: string
  price: string
  badge: string
  badgeColor: 'green' | 'orange' | 'blue' | 'gray'
  highlight: boolean
  cta: string
  extra?: string
}

export interface ComboConfig {
  enabled: boolean
  title: string
  subtitle: string
  price: string
  cta: string
  benefits: string[]
}

export interface SocialProofNotification {
  name: string
  action: string
  plan: string
}

export interface SocialProofConfig {
  enabled: boolean
  notifications: SocialProofNotification[]
}

export interface FeedItem {
  id: string
  type: 'image' | 'video'
  src: string
  blur: boolean
  likes: string
  comments: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface TestimonialItem {
  name: string
  avatar: string
  quote: string
}

export interface FooterLink {
  label: string
  href: string
}

export interface FooterConfig {
  text: string
  links: FooterLink[]
}

export interface SiteConfig {
  promo: PromoConfig
  model: ModelConfig
  stats: StatsConfig
  plans: PlanConfig[]
  combo: ComboConfig
  socialProof: SocialProofConfig
  feed: FeedItem[]
  testimonials: TestimonialItem[]
  faq: FaqItem[]
  footer: FooterConfig
}
