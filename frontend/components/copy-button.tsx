'use client'

import { Copy } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      className="p-1 rounded transition-colors hover:bg-white/[0.06]"
      style={{ color: 'var(--muted-foreground)' }}
      aria-label="Copy to clipboard"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text) } catch {}
      }}
    >
      <Copy size={11} />
    </button>
  )
}
