import fs from 'node:fs/promises'
import path from 'node:path'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { GlassCard } from '@/components/ui'

export const metadata = {
  title: 'ERC Draft — Syntrophic.md',
  description:
    'Latest Syntrophic ERC draft loaded from docs/ERC-Syntrophic-Draft.md',
}

async function loadDraft(): Promise<string> {
  const primary = path.join(process.cwd(), '..', 'docs', 'ERC-Syntrophic-Draft.md')
  const fallback = path.join(process.cwd(), 'docs', 'ERC-Syntrophic-Draft.md')

  try {
    return await fs.readFile(primary, 'utf8')
  } catch {
    return await fs.readFile(fallback, 'utf8')
  }
}

export default async function ErcDraftPage() {
  const draft = await loadDraft()

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ color: 'var(--foreground)' }}>
      <Navbar />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <GlassCard className="p-6 md:p-8 mb-6">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                ERC Draft
              </span>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Syntrophic Reputation Protocol draft
              </h1>
              <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                This live draft reflects the current V2 protocol surface: Base mainnet bonding, canonical
                <code className="mx-1 text-xs">syntrophic.*</code>
                metadata, sponsored onboarding, and the x402-funded demo flow used to issue a Syntrophic verified badge.
              </p>
            </div>
          </GlassCard>
          <GlassCard elevated className="p-6 md:p-10">
            <pre
              className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words overflow-x-auto"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {draft}
            </pre>
          </GlassCard>
        </div>
      </main>

      <Footer />
    </div>
  )
}
