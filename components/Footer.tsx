import PrivacyLogo from './icons/PrivacyLogo'
import { FooterConfig } from '@/types/site'

interface Props {
  footer: FooterConfig
}

export default function Footer({ footer }: Props) {
  return (
    <footer className="bg-[#f9f9f9] border-t border-gray-100 px-4 py-8 text-center pb-24">
      <PrivacyLogo className="h-6 w-auto mx-auto mb-4 opacity-50" />

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-4">
        {footer.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-xs text-orange-400 hover:text-gray-600 transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>

      <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
        {footer.text}
      </p>
    </footer>
  )
}
