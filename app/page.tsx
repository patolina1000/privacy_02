import siteConfig from '@/config/site.json'
import { SiteConfig } from '@/types/site'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Plans from '@/components/Plans'
import Feed from '@/components/Feed'
import Combo from '@/components/Combo'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import SocialProof from '@/components/SocialProof'
import Footer from '@/components/Footer'
import FunnelTracker from '@/components/FunnelTracker'
import UpsellResume from '@/components/UpsellResume'

const config = siteConfig as SiteConfig

export default function Home() {
  return (
    <main className="flex justify-center bg-[#f5f5f5] min-h-screen">
      <FunnelTracker />
      <UpsellResume />
      <div className="w-full max-w-[430px] bg-white relative overflow-hidden shadow-xl">
        <Header promo={config.promo} />
        <Hero model={config.model} stats={config.stats} />
        <Plans plans={config.plans} />
        <Feed feed={config.feed} stats={config.stats} model={config.model} />
        <Combo combo={config.combo} />
        <Testimonials testimonials={config.testimonials} />
        <FAQ faq={config.faq} />
        <Footer footer={config.footer} />
        {config.socialProof.enabled && (
          <SocialProof config={config.socialProof} />
        )}
      </div>
    </main>
  )
}
