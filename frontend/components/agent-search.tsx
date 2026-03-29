'use client'

import { Search, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FilterPill = {
  label: string
  value: string
}

export type AgentSearchFilter = 'all' | 'syntrophic' | 'bonded-demo' | 'mainnet'

const TABS: FilterPill[] = [
  { label: 'All Agents', value: 'all' },
  { label: 'Syntrophic', value: 'syntrophic' },
  { label: 'Bonded (Demo)', value: 'bonded-demo' },
  { label: 'Mainnet Only', value: 'mainnet' },
]

type AgentSearchProps = {
  query?: string
  filter?: AgentSearchFilter
  onQueryChange?: (value: string) => void
  onFilterChange?: (value: AgentSearchFilter) => void
  navigateOnSubmit?: boolean
}

export function AgentSearch({
  query,
  filter,
  onQueryChange,
  onFilterChange,
  navigateOnSubmit = true,
}: AgentSearchProps = {}) {
  const router = useRouter()
  const [internalQuery, setInternalQuery] = useState('')
  const [internalFilter, setInternalFilter] = useState<AgentSearchFilter>('all')

  const liveQuery = query ?? internalQuery
  const activeTab = filter ?? internalFilter

  const setLiveQuery = (value: string) => {
    onQueryChange?.(value)
    if (query === undefined) setInternalQuery(value)
  }

  const setActiveFilter = (value: AgentSearchFilter) => {
    onFilterChange?.(value)
    if (filter === undefined) setInternalFilter(value)
  }

  const handleSearch = () => {
    if (!navigateOnSubmit) return
    const params = new URLSearchParams()
    if (liveQuery) params.set('q', liveQuery)
    if (activeTab !== 'all') params.set('filter', activeTab)
    router.push(`/explore${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}
      >
        <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <input
          type="text"
          value={liveQuery}
          onChange={(e) => setLiveQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by agent name, skills, address, or ID"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-sm"
          style={{ color: 'var(--foreground)' }}
        />
        <button
          onClick={handleSearch}
          className="p-1.5 rounded transition-colors flex-shrink-0"
          style={{ color: 'var(--accent)', opacity: 0.7 }}
          aria-label="Search agents"
        >
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Filter tabs + discovery indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value as AgentSearchFilter)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={
                activeTab === tab.value
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted-foreground)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            ERC-8004 Agent Discovery
          </span>
        </div>
      </div>
    </div>
  )
}
