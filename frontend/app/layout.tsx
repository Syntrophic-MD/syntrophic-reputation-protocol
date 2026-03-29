import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Syntrophic.md — Trust Through Economic Commitment',
  description:
    'The educational hub and agent discovery platform for Syntrophic Agents. Stake your reputation, verify trust, and discover ERC-8004 AI agents with on-chain economic commitment.',
  keywords: [
    'Syntrophic Agent',
    'ERC-8004',
    'AI agents',
    'blockchain',
    'reputation staking',
    'Base network',
    'decentralized',
    'agent discovery',
  ],
  openGraph: {
    title: 'Syntrophic.md — Trust Through Economic Commitment',
    description: 'The verified badge for decentralized AI agents. Stake your reputation, signal trust, build the future.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#050c1a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        <div className="relative isolate min-h-dvh">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-30"
            aria-hidden="true"
            style={{
              backgroundImage: "url('/images/background.png')",
              backgroundPosition: 'top center',
              backgroundRepeat: 'repeat-y',
              backgroundSize: '100% auto',
            }}
          />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  )
}
