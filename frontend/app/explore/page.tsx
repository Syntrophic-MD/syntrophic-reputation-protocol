'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'
import { Search, CheckCircle, ArrowUpDown, LayoutGrid, List, X, Globe, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { GlassCard, TrustBadge, AgentAvatar } from '@/components/ui'
import { truncateAddress, getRepLevel } from '@/lib/utils'
import {
  fetchAgents,
  agentInitials,
  chainName,
  CHAIN_ID_TO_SLUG,
  type Agent8004,
  type AgentsQuery,
  type SortBy,
} from '@/lib/api'

type FilterKey = 'all' | 'syntrophic' | 'bonded_demo' | 'mainnet'
type ViewMode = 'grid' | 'list'

const sortOptions: { value: SortBy; label: string }[] = [
  { value: 'total_score', label: 'Best Reputation' },
  { value: 'star_count', label: 'Most Stars' },
  { value: 'total_feedbacks', label: 'Most Active' },
  { value: 'created_at', label: 'Most Recent' },
]

const filterOptions: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'All Agents' },
  { value: 'syntrophic', label: 'Syntrophic' },
  { value: 'bonded_demo', label: 'Bonded (Demo)' },
  { value: 'mainnet', label: 'Mainnet Only' },
]

const PAGE_SIZE = 20

const swrFetcher = ([, query]: [string, AgentsQuery]) => fetchAgents(query)

export default function ExplorePage() {
  const initializedFromUrl = useRef(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortBy>('total_score')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(1)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (initializedFromUrl.current) return
    initializedFromUrl.current = true

    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    const incoming = params.get('filter')?.trim().toLowerCase()
    if (q) setSearch(q)

    if (incoming === 'syntrophic') setFilter('syntrophic')
    if (incoming === 'bonded-demo' || incoming === 'bonded (demo)') setFilter('bonded_demo')
    if (incoming === 'mainnet' || incoming === 'mainnet only') setFilter('mainnet')
    if (incoming === 'all' || incoming === 'all agents') setFilter('all')
  }, [])

  const resolvedSearch = useMemo(() => {
    const clean = debouncedSearch.trim()
    if (filter === 'syntrophic' || filter === 'bonded_demo') {
      return clean ? `syntrophic ${clean}` : 'syntrophic'
    }
    return clean || undefined
  }, [debouncedSearch, filter])

  const query: AgentsQuery = {
    page,
    page_size: PAGE_SIZE,
    sort_by: sort,
    sort_order: 'desc',
    search: resolvedSearch,
    is_testnet: filter === 'mainnet' ? false : undefined,
  }

  const { data, error, isLoading } = useSWR(
    ['/api/v1/agents', query],
    swrFetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const agents = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const {
    data: statusByAgentId = {},
    isLoading: isBondedLoading,
  } = useSWR(
    agents.length > 0 ? `syntrophic-status:${agents.map((a) => a.agent_id).join('|')}` : null,
    async () => {
      const entries = await Promise.all(
        agents.map(async (agent) => {
          try {
            const encodedAgentId = encodeURIComponent(agent.agent_id)
            const res = await fetch(`/api/agents/${encodedAgentId}`)
            if (!res.ok) return [agent.agent_id, null] as const
            const detail = await res.json()
            const onchain = Array.isArray(detail?.raw_metadata?.onchain) ? detail.raw_metadata.onchain : []
            const statusEntry = onchain.find((entry: unknown) => {
              if (!entry || typeof entry !== 'object') return false
              return (entry as { key?: unknown }).key === 'syntrophic.status'
            }) as { key?: string; value?: string; decoded?: unknown } | undefined
            const status = normalizeSyntrophicStatus(statusEntry?.decoded, statusEntry?.value)
            return [agent.agent_id, status] as const
          } catch {
            return [agent.agent_id, null] as const
          }
        })
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const visibleAgents = useMemo(() => {
    let subset = agents

    if (filter === 'syntrophic' || filter === 'bonded_demo') {
      subset = subset.filter((agent) => agent.name.toLowerCase().includes('syntrophic'))
    }

    return subset
  }, [agents, filter])

  const visibleTotal = filter === 'syntrophic' || filter === 'bonded_demo' ? visibleAgents.length : total
  const averageVisibleScore = visibleAgents.length > 0
    ? (visibleAgents.reduce((acc, a) => acc + a.total_score, 0) / visibleAgents.length).toFixed(1)
    : null
  const bondedOnPage = agents.filter((a) => isBondedState(statusByAgentId[a.agent_id])).length

  const handleSortChange = useCallback((val: SortBy) => {
    setSort(val)
    setPage(1)
  }, [])

  const handleFilterChange = useCallback((val: FilterKey) => {
    setFilter(val)
    setPage(1)
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Page header */}
        <div className="relative overflow-hidden border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-0 spotlight pointer-events-none" />
          <div className="orb orb-blue" style={{ width: 400, height: 300, top: -50, right: '10%', opacity: 0.25 }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--accent)' }}>
                  Syntrophic Agent Discovery
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Agent Explorer
                </h1>
                <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  {isLoading
                    ? 'Loading registry…'
                    : `${visibleTotal.toLocaleString()} agents shown — search by name, description, or address`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="stat-number text-xl font-bold text-foreground">
                    {isLoading ? '—' : visibleTotal.toLocaleString()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Total</p>
                </div>
                <div className="text-center">
                  <p className="stat-number text-xl font-bold" style={{ color: 'var(--accent)' }}>
                    {isLoading || isBondedLoading ? '—' : bondedOnPage}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Bonded (Demo)</p>
                </div>
                <div className="text-center">
                  <p className="stat-number text-xl font-bold" style={{ color: 'var(--verified)' }}>
                    {isLoading ? '—' : averageVisibleScore ?? '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Avg Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search by name, address, or protocol…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-glass w-full pl-9 pr-4 py-2.5 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortBy)}
              className="input-glass px-3 py-2.5 text-sm pr-8 min-w-[160px] cursor-pointer"
              aria-label="Sort agents"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value} style={{ background: '#050c1a' }}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['grid', 'list'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="p-2.5 transition-colors"
                  style={{
                    background: view === v ? 'rgba(0,112,243,0.2)' : 'transparent',
                    color: view === v ? 'var(--accent)' : 'var(--muted-foreground)',
                  }}
                  aria-label={`${v} view`}
                >
                  {v === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-1 flex-wrap">
            {filterOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={
                  filter === f.value
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted-foreground)' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results count + loading indicator */}
          <div className="flex items-center justify-between mt-4 mb-6">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin" />
                  Loading…
                </span>
              ) : (
                <>
                  Showing{' '}
                  <span className="text-foreground font-medium">
                    {visibleAgents.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min((page - 1) * PAGE_SIZE + visibleAgents.length, visibleTotal)}
                  </span>{' '}
                  of <span className="text-foreground font-medium">{visibleTotal.toLocaleString()}</span> agents
                  {debouncedSearch && (
                    <> matching <span className="text-foreground font-medium">&ldquo;{debouncedSearch}&rdquo;</span></>
                  )}
                </>
              )}
            </p>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <ArrowUpDown size={12} />
              <span>{sortOptions.find((s) => s.value === sort)?.label}</span>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <GlassCard className="p-10 flex flex-col items-center gap-3 text-center">
              <p className="text-lg font-semibold text-foreground">Failed to load agents</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Could not reach the 8004scan API. Please try again shortly.
              </p>
            </GlassCard>
          )}

          {/* Agent grid / list */}
          {!error && (
            <>
              {isLoading && agents.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : visibleAgents.length === 0 ? (
                <GlassCard className="p-16 flex flex-col items-center gap-3 text-center">
                  <p className="text-lg font-semibold text-foreground">No agents found</p>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Try adjusting your search or filters
                  </p>
                </GlassCard>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      bonded={statusByAgentId[agent.agent_id] == null ? null : isBondedState(statusByAgentId[agent.agent_id])}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
                  >
                    <div className="col-span-4">Agent</div>
                    <div className="col-span-2 text-right">Score</div>
                    <div className="col-span-2 text-right">Stars</div>
                    <div className="col-span-2 text-right">Feedback</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  {visibleAgents.map((agent) => (
                    <AgentListRow
                      key={agent.id}
                      agent={agent}
                      bonded={statusByAgentId[agent.agent_id] == null ? null : isBondedState(statusByAgentId[agent.agent_id])}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {(filter === 'all' || filter === 'mainnet') && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-40"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Page <span className="text-foreground font-medium">{page}</span> of{' '}
                    <span className="text-foreground font-medium">{totalPages}</span>
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-ghost flex items-center gap-1.5 text-sm px-4 py-2 disabled:opacity-40"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── Agent Card (grid) ────────────────────────────────────────────────────────

function AgentCard({ agent, bonded }: { agent: Agent8004; bonded: boolean | null }) {
  const level = getRepLevel(agent.total_score)
  const initials = agentInitials(agent.name)
  const chainSlug = CHAIN_ID_TO_SLUG[agent.chain_id] ?? String(agent.chain_id)
  return (
    <Link href={`/agents/${chainSlug}/${agent.token_id}`}>
      <GlassCard className="p-5 flex flex-col gap-4 h-full transition-all duration-200 hover:-translate-y-1 cursor-pointer" hover>
        {/* Header */}
        <div className="flex items-start justify-between">
          {agent.image_url ? (
            <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <Image src={agent.image_url} alt={agent.name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <AgentAvatar name={initials} address={agent.owner_address} size={44} />
          )}
          <TrustBadge score={Math.round(agent.total_score)} size="md" />
        </div>

        {/* Name and agent_id */}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-foreground truncate">{agent.name}</span>
            {agent.is_verified && <CheckCircle size={13} style={{ color: 'var(--verified)' }} />}
          </div>
          <p className="address-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
            {truncateAddress(agent.owner_address, 6)}
          </p>
        </div>

        {/* Description */}
        {agent.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
            {agent.description}
          </p>
        )}

        {/* Protocols */}
        {agent.supported_protocols?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {agent.supported_protocols.slice(0, 3).map((p, i) => {
              const label = typeof p === 'string' ? p : typeof p === 'object' && p !== null ? (p as Record<string, unknown>).name as string ?? JSON.stringify(p) : String(p)
              return (
              <span
                key={label + i}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {label}
              </span>
            )})}

          </div>
        )}

        <div className="divider" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="stat-number text-sm font-bold" style={{ color: level.color }}>
              {Math.round(agent.total_score)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Score</p>
          </div>
          <div>
            <p className="stat-number text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {agent.star_count.toLocaleString()}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Stars</p>
          </div>
          <div>
            <p className="stat-number text-sm font-bold text-foreground">
              {agent.total_feedbacks}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Feedback</p>
          </div>
        </div>

        {/* Chain + badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--muted-foreground)',
            }}
          >
            <Globe size={10} />
            {chainName(agent.chain_id)}
          </span>
          {agent.is_verified && <span className="badge-verified">Verified</span>}
          {bonded !== null && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={
                bonded
                  ? { background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.28)', color: '#00c853' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }
              }
            >
              {bonded ? 'Bonded' : 'Not Bonded'}
            </span>
          )}
          {agent.x402_supported && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{
                background: 'rgba(0,112,243,0.1)',
                border: '1px solid rgba(0,112,243,0.2)',
                color: 'var(--accent)',
              }}
            >
              x402
            </span>
          )}
        </div>
      </GlassCard>
    </Link>
  )
}

// ─── Agent List Row ───────────────────────────────────────────────────────────

function AgentListRow({ agent, bonded }: { agent: Agent8004; bonded: boolean | null }) {
  const level = getRepLevel(agent.total_score)
  const initials = agentInitials(agent.name)
  const chainSlug = CHAIN_ID_TO_SLUG[agent.chain_id] ?? String(agent.chain_id)
  return (
    <Link href={`/agents/${chainSlug}/${agent.token_id}`}>
      <GlassCard className="px-4 py-3 transition-all duration-150 hover:border-white/[0.14] cursor-pointer">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
            {agent.image_url ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <Image src={agent.image_url} alt={agent.name} fill className="object-cover" unoptimized />
              </div>
            ) : (
              <AgentAvatar name={initials} address={agent.owner_address} size={36} />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-foreground truncate">{agent.name}</span>
                {agent.is_verified && <CheckCircle size={12} style={{ color: 'var(--verified)' }} />}
              </div>
              <p className="address-mono text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                {truncateAddress(agent.owner_address, 6)}
              </p>
            </div>
          </div>
          <div className="hidden sm:block col-span-2 text-right">
            <span className="stat-number text-sm font-bold" style={{ color: level.color }}>
              {Math.round(agent.total_score)}
            </span>
          </div>
          <div className="hidden sm:block col-span-2 text-right">
            <span className="stat-number text-sm font-medium" style={{ color: 'var(--accent)' }}>
              {agent.star_count.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:block col-span-2 text-right">
            <span className="text-sm text-foreground">{agent.total_feedbacks}</span>
          </div>
          <div className="hidden sm:flex col-span-2 justify-end gap-1.5 items-center">
            {bonded === null ? (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {chainName(agent.chain_id)}
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                style={
                  bonded
                    ? { background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.28)', color: '#00c853' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--muted-foreground)' }
                }
              >
                {bonded ? 'Bonded' : 'Not Bonded'}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}

// ─── Skeleton card (loading state) ───────────────────────────────────────────

function SkeletonCard() {
  return (
    <GlassCard className="p-5 flex flex-col gap-4 h-52 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="w-10 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 rounded w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
      <div className="h-8 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="divider" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    </GlassCard>
  )
}

function isBondedState(status: string | null | undefined): boolean {
  if (!status) return false
  const normalized = status.toUpperCase()
  return normalized.includes('BOND') || normalized.includes('STAK')
}

function normalizeSyntrophicStatus(decoded: unknown, value: unknown): string | null {
  const candidates: string[] = []

  if (typeof decoded === 'string') candidates.push(decoded)
  if (typeof value === 'string') {
    candidates.push(value)
    if (value.startsWith('0x')) candidates.push(decodeHexText(value))
  }

  for (const candidate of candidates) {
    const raw = candidate.trim()
    if (!raw) continue
    const upper = raw.toUpperCase()
    if (upper.includes('BOND') || upper.includes('STAK')) return 'BONDED'
    if (upper.includes('SLASH')) return 'SLASHED'
    if (upper.includes('WITHDRAW') || upper.includes('UNBOND')) return 'WITHDRAWN'
    return upper.replace(/[^A-Z0-9_-]/g, '')
  }

  return null
}

function decodeHexText(hex: string): string {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  let out = ''
  for (let i = 0; i < clean.length; i += 2) {
    const pair = clean.slice(i, i + 2)
    if (pair.length < 2) break
    const code = Number.parseInt(pair, 16)
    if (!Number.isFinite(code) || Number.isNaN(code)) continue
    if (code >= 32 && code <= 126) out += String.fromCharCode(code)
  }
  return out.replace(/\s+/g, ' ').trim()
}
