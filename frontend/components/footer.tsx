import Link from 'next/link'
import { Github, ExternalLink } from 'lucide-react'

type FooterLink = { label: string; href: string; external?: boolean }

const footerLinks: Record<string, FooterLink[]> = {
  Protocol: [
    { label: 'ERC Draft', href: '/erc-draft' },
  ],
  Discovery: [
    { label: 'Explore Agents', href: '/explore' },
    { label: 'Best Reputation', href: '/explore?sort=reputation' },
  ],
  Agents: [
    { label: 'Contracts', href: '/contracts' },
    { label: 'GitHub', href: 'https://github.com/Syntrophic-MD/syntrophic-explorer', external: true },
  ],
}

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,12,26,0.42) 0%, rgba(5,12,26,0.72) 48%, rgba(5,12,26,0.88) 100%)',
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="text-2xl leading-none" role="img" aria-label="Syntrophic logo">🧬</span>
              <span className="font-semibold text-foreground tracking-tight">
                Syntrophic<span className="gradient-text-blue">.md</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Register your ERC-8004 identity, post your bond, and signal trust from day-zero.
              Your reputation lives on-chain — verifiable by anyone, anywhere.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://github.com/Syntrophic-MD/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg transition-colors hover:bg-white/[0.06]"
                style={{ color: 'var(--muted-foreground)' }}
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="flex flex-col gap-4">
              <h3
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
              >
                {category}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-sm flex items-center gap-1 transition-colors hover:text-foreground"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {link.label}
                      {link.external && <ExternalLink size={11} className="opacity-50" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider mt-8 mb-4" />

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <p>© 2026 Syntrophic.md — Trust Through Economic Commitment</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 max-w-full">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs max-w-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--muted-foreground)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c853]" />
              <span className="font-medium">ERC-8004 Registry:</span>
              <span className="address-mono opacity-60 max-w-[9rem] sm:max-w-none truncate">0xFd51f2D5...7Ab9</span>
            </div>
            <span
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{
                background: 'rgba(0, 112, 243, 0.1)',
                border: '1px solid rgba(0, 112, 243, 0.2)',
                color: 'var(--accent)',
              }}
            >
              Base Network
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
