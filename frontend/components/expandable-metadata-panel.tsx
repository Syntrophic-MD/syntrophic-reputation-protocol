'use client'

import { useState } from 'react'
import { ChevronDown, Code, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/ui'
import { CopyButton } from '@/components/copy-button'

interface ExpandableMetadataPanelProps {
  metadata: unknown
  uri?: string | null
}

export function ExpandableMetadataPanel({ metadata, uri }: ExpandableMetadataPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formattedJson = JSON.stringify(metadata, null, 2)

  return (
    <GlassCard className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <Code size={16} style={{ color: 'var(--accent)', opacity: 0.7 }} />
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
              Raw Data
            </p>
            <h3 className="font-semibold text-foreground text-sm">Offchain Metadata</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {uri && (
            <a
              href={uri}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/[0.06]"
              style={{ color: 'var(--muted-foreground)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ExternalLink size={12} />
              View Source
            </a>
          )}
          <ChevronDown
            size={18}
            className="transition-transform duration-200"
            style={{
              color: 'var(--muted-foreground)',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '600px' : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="px-6 pb-6">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={formattedJson} />
            </div>
            <pre
              className="p-4 pr-12 overflow-auto text-xs leading-relaxed font-mono whitespace-pre-wrap break-words"
              style={{ color: 'var(--muted-foreground)', maxHeight: '500px', wordBreak: 'break-word' }}
            >
              <code className="whitespace-pre-wrap break-words">{formattedJson}</code>
            </pre>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
