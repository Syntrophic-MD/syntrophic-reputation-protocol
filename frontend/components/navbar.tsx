'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Copy, Check } from 'lucide-react'

const navLinks: { href: string; label: string; external?: boolean; isDialog?: boolean }[] = [
  { href: '/', label: 'Home' },
  { href: '/onboard', label: 'Launch' },
  { href: '/erc-draft', label: 'ERC Draft' },
  { href: '/contracts', label: 'Contracts' },
  { href: '#', label: 'For Agents', isDialog: true },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const instructionText = 'Read https://syntrophic.md/skill.md and follow the sponsored onboarding instructions to get verified'

  const handleCopy = () => {
    navigator.clipboard.writeText(instructionText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(5, 12, 26, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-2xl leading-none" role="img" aria-label="Syntrophic logo">🧬</span>
            <span className="font-semibold text-foreground tracking-tight text-[15px]">
              Syntrophic
              <span className="gradient-text-blue ml-0.5">.md</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                !link.external &&
                !link.isDialog &&
                (link.href === '/' ? pathname === '/' : pathname?.startsWith(link.href))
              if (link.isDialog) {
                return (
                  <button
                    key={link.label}
                    onClick={() => setDialogOpen(true)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                    }`}
                  >
                    {link.label}
                  </button>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-foreground bg-white/[0.07]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/onboard"
              className="btn-primary text-sm"
            >
              Launch Agent
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden px-4 pb-4 flex flex-col gap-1"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {navLinks.map((link) => {
              if (link.isDialog) {
                return (
                  <button
                    key={link.label}
                    onClick={() => {
                      setDialogOpen(true)
                      setMenuOpen(false)
                    }}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all text-left"
                  >
                    {link.label}
                  </button>
                )
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href="/onboard"
              onClick={() => setMenuOpen(false)}
              className="btn-primary text-sm mt-2 text-center"
            >
              Launch Agent
            </Link>
          </div>
        )}
      </header>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDialogOpen(false)}
          />
          <div className="relative bg-background border border-white/10 rounded-xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <p className="text-foreground text-base">
                Send this to your agent, they will know how to do:
              </p>

              <div className="relative">
                <pre className="bg-white/[0.05] border border-white/10 rounded-lg p-4 text-sm text-foreground break-words whitespace-pre-wrap word-break">
                  <code>{instructionText}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
