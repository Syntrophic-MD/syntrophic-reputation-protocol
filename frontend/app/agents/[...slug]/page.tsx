import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  Activity,
  ExternalLink,
  AlertTriangle,
  Star,
  Globe,
  Zap,
  FileCheck,
  MessageSquare,
  Hash,
  Clock,
  Cpu,
  BadgeCheck,
  HeartPulse,
  BarChart3,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { GlassCard, TrustBadge, AgentAvatar } from '@/components/ui'
import { truncateAddress, getRepLevel, formatDate } from '@/lib/utils'
import { fetchAgent, agentInitials, chainName, CHAIN_SLUG_TO_ID, REGISTRY_BY_CHAIN, type AgentDetail } from '@/lib/api'
import { CopyButton } from '@/components/copy-button'

export const dynamic = 'force-dynamic'

export default async function AgentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params

  const chainSlug = slug[0] ?? ''
  const tokenId = slug[1] ?? ''

  if (!chainSlug || !tokenId) notFound()

  const chainIdNum = CHAIN_SLUG_TO_ID[chainSlug.toLowerCase()]
  if (!chainIdNum) notFound()

  const registry = REGISTRY_BY_CHAIN[chainIdNum] ?? '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432'
  const agentId = `${chainIdNum}:${registry}:${tokenId}`

  let agent: AgentDetail
  try {
    agent = await fetchAgent(agentId)
  } catch {
    notFound()
  }

  const level = getRepLevel(agent.total_score)
  const initials = agentInitials(agent.name)

  const parts = agent.agent_id.split(':')
  const registryAddress = parts[1] ?? agent.contract_address
  const resolvedTokenId = parts[2] ?? agent.token_id

  const parseStatus = agent.parse_status
  const syntrophic = extractSyntrophicMetadata(agent)
  const hasSyntrophic =
    syntrophic.status !== null ||
    syntrophic.score !== null ||
    syntrophic.reviewCount !== null ||
    syntrophic.updatedAt !== null ||
    syntrophic.validator !== null
  const syntrophicTone = getSyntrophicTone(syntrophic.status)
  const syntrophicUpdatedLabel = syntrophic.updatedAt != null ? formatUnixTimestamp(syntrophic.updatedAt) : null
  const syntrophicSourceLabel = Array.from(
    new Set(
      [
        agent.field_sources?.['syntrophic.status'],
        agent.field_sources?.['syntrophic.score'],
        agent.field_sources?.['syntrophic.reviewCount'],
        agent.field_sources?.['syntrophic.updatedAt'],
        agent.field_sources?.['syntrophic.validator'],
      ].filter((source): source is string => typeof source === 'string' && source.length > 0)
    )
  ).join(', ')
  // Guard: only treat services as iterable if it looks like { protocolName: { endpoint: string, ... } }
  // The API sometimes returns services as a flat status object instead
  const rawServices = agent.services ?? {}
  const isValidServicesMap = typeof rawServices === 'object' && !Array.isArray(rawServices) &&
    Object.values(rawServices).some((v) => v && typeof v === 'object' && typeof (v as Record<string, unknown>).endpoint === 'string')
  const services = isValidServicesMap ? rawServices : {}
  const serviceEntries = Object.entries(services).filter(
    ([, v]) => v && typeof v === 'object' && typeof (v as { endpoint?: string }).endpoint === 'string'
  )

  // Block explorer base for this chain
  const explorerBase: Record<number, string> = {
    1: 'https://etherscan.io',
    8453: 'https://basescan.org',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    137: 'https://polygonscan.com',
    42220: 'https://celoscan.io',
    56: 'https://bscscan.com',
    84532: 'https://sepolia.basescan.org',
  }
  const explorer = explorerBase[agent.chain_id] ?? 'https://basescan.org'

  const technicalRows: Array<{ label: string; value: string; mono?: boolean; copy?: boolean; link?: string }> = [
    { label: 'Agent ID', value: agent.agent_id, mono: true, copy: true },
    { label: 'Token ID', value: resolvedTokenId },
    { label: 'Registry Contract', value: registryAddress, mono: true, copy: true },
    { label: 'Network', value: `${chainName(agent.chain_id)} — Chain ID ${agent.chain_id}` },
    { label: 'Owner', value: agent.owner_address, mono: true, copy: true, link: `${explorer}/address/${agent.owner_address}` },
    ...(agent.owner_ens ? [{ label: 'ENS', value: agent.owner_ens }] : []),
    ...(agent.owner_certified_name ? [{ label: 'Certified Name', value: agent.owner_certified_name }] : []),
    { label: 'Registered', value: formatDate(agent.created_at) },
    { label: 'Updated', value: formatDate(agent.updated_at) },
    ...(agent.created_block_number ? [{ label: 'Block', value: `#${agent.created_block_number.toLocaleString()}` }] : []),
  ]

  if (hasSyntrophic) {
    if (syntrophic.status) {
      technicalRows.push({ label: 'Syntrophic Status', value: syntrophic.status })
    }
    if (syntrophic.score != null) {
      technicalRows.push({ label: 'Syntrophic Score', value: `${syntrophic.score}/100` })
    }
    if (syntrophic.reviewCount != null) {
      technicalRows.push({ label: 'Syntrophic Reviews', value: syntrophic.reviewCount.toLocaleString() })
    }
    if (syntrophicUpdatedLabel) {
      technicalRows.push({ label: 'Syntrophic Updated', value: syntrophicUpdatedLabel })
    }
    if (syntrophic.validator) {
      technicalRows.push({
        label: 'Syntrophic Validator',
        value: syntrophic.validator,
        mono: true,
        copy: true,
        link: `${explorer}/address/${syntrophic.validator}`,
      })
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-16">
        {/* Back */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <ArrowLeft size={15} />
            Back to Explorer
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex flex-col gap-6">

          {/* ── Hero ── */}
          <GlassCard elevated className="p-6 md:p-8 relative overflow-hidden">
            <div className="orb orb-blue" style={{ width: 320, height: 320, top: -100, right: -100, opacity: 0.18 }} />
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">

              {/* Avatar */}
              <div className="flex-shrink-0">
                {agent.image_url ? (
                  <div
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Image src={agent.image_url} alt={agent.name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <AgentAvatar name={initials} address={agent.owner_address} size={80} />
                )}
              </div>

              {/* Name, badges, description */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {agent.name}
                  </h1>
                  {agent.is_verified && (
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(0,200,83,0.12)', border: '1px solid rgba(0,200,83,0.25)', color: 'var(--verified)' }}
                    >
                      <CheckCircle size={11} /> Verified
                    </span>
                  )}
                  {agent.x402_supported && (
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(0,112,243,0.12)', border: '1px solid rgba(0,112,243,0.25)', color: 'var(--accent)' }}
                    >
                      <Zap size={11} /> x402
                    </span>
                  )}
                  {agent.is_endpoint_verified && (
                    <span
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
                    >
                      <BadgeCheck size={11} /> Endpoint Verified
                    </span>
                  )}
                  {agent.is_testnet && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(255,160,0,0.1)', border: '1px solid rgba(255,160,0,0.25)', color: '#ffa000' }}
                    >
                      Testnet
                    </span>
                  )}
                </div>

                {/* Owner */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {agent.owner_username && (
                    <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                      @{agent.owner_username}
                    </span>
                  )}
                  <code
                    className="address-mono text-xs px-2 py-1 rounded-md"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--muted-foreground)' }}
                  >
                    {truncateAddress(agent.owner_address, 8)}
                  </code>
                  <CopyButton text={agent.owner_address} />
                  <a
                    href={`${explorer}/address/${agent.owner_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md transition-colors hover:bg-white/[0.06]"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-label="View owner on block explorer"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                {agent.description && (
                  <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
                    {agent.description}
                  </p>
                )}

                {/* Tags */}
                {agent.tags && agent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted-foreground)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Protocols */}
                {agent.supported_protocols.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.supported_protocols.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{ background: 'rgba(0,112,243,0.1)', border: '1px solid rgba(0,112,243,0.2)', color: 'var(--accent)' }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Trust score */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 md:ml-auto">
                <TrustBadge score={Math.round(agent.total_score)} size="lg" />
                <p className="text-sm font-bold text-center" style={{ color: level.color }}>{level.label}</p>
                <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>Trust Tier</p>
                {agent.rank && (
                  <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                    Rank #{agent.rank}
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: BarChart3, label: 'Rep. Score', value: `${Math.round(agent.total_score)}`, unit: '/100', color: level.color },
              { icon: HeartPulse, label: 'Health', value: agent.health_score != null ? `${Math.round(agent.health_score)}` : '—', unit: agent.health_score != null ? '/100' : '', color: agent.health_score != null && agent.health_score > 60 ? 'var(--verified)' : '#ffa000' },
              { icon: MessageSquare, label: 'Feedbacks', value: agent.total_feedbacks.toLocaleString(), unit: '', color: 'var(--accent)' },
              { icon: Star, label: 'Avg. Score', value: agent.average_score > 0 ? `${Math.round(agent.average_score)}` : '—', unit: agent.average_score > 0 ? '/100' : '', color: 'var(--accent)' },
              { icon: Activity, label: 'Stars', value: agent.star_count.toLocaleString(), unit: '', color: '#ffa000' },
              { icon: Globe, label: 'Network', value: chainName(agent.chain_id), unit: '', color: 'var(--foreground)' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <GlassCard key={stat.label} className="p-4 flex flex-col gap-2" hover>
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} style={{ color: stat.color, opacity: 0.8 }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)', opacity: 0.55 }}>
                      {stat.label}
                    </span>
                  </div>
                  <p className="stat-number text-lg font-bold leading-none" style={{ color: stat.color }}>
                    {stat.value}<span className="text-xs font-normal opacity-60">{stat.unit}</span>
                  </p>
                </GlassCard>
              )
            })}
          </div>

          {/* ── Syntrophic Bond Status ── */}
          {hasSyntrophic && (
            <GlassCard className="p-6 flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <SectionHeader label="Live Mainnet Deployment" title="Syntrophic Bonding Status" icon={Shield} />
                {syntrophic.status && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 w-fit"
                    style={{
                      background: syntrophicTone.bg,
                      border: `1px solid ${syntrophicTone.border}`,
                      color: syntrophicTone.color,
                    }}
                  >
                    <CheckCircle size={11} />
                    {syntrophic.status}
                  </span>
                )}
              </div>

              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                This profile includes on-chain <code>syntrophic.*</code> metadata from ERC-8004, enabling portable proof of bond state across platforms.
              </p>
              {syntrophicSourceLabel && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.75 }}>
                  Data source: {syntrophicSourceLabel}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricTile
                  label="Bond Status"
                  value={syntrophic.status ?? 'Not set'}
                  color={syntrophicTone.color}
                />
                <MetricTile
                  label="Bond Score"
                  value={syntrophic.score != null ? `${syntrophic.score}/100` : 'Not set'}
                  color="var(--accent)"
                />
                <MetricTile
                  label="Review Count"
                  value={syntrophic.reviewCount != null ? syntrophic.reviewCount.toLocaleString() : 'Not set'}
                  color="var(--foreground)"
                />
                <MetricTile
                  label="Updated At"
                  value={syntrophicUpdatedLabel ?? 'Not set'}
                  color="var(--muted-foreground)"
                />
              </div>

              {syntrophic.validator && (
                <div
                  className="rounded-xl p-3.5 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
                      Validator Contract
                    </p>
                    <code className="address-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {truncateAddress(syntrophic.validator, 10)}
                    </code>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <CopyButton text={syntrophic.validator} />
                    <a
                      href={`${explorer}/address/${syntrophic.validator}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded transition-colors hover:bg-white/[0.06]"
                      style={{ color: 'var(--muted-foreground)' }}
                      aria-label="View validator on explorer"
                    >
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {/* ── Main two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left — 2/3 */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Services / Endpoints */}
              {serviceEntries.length > 0 && (
                <GlassCard className="p-6 flex flex-col gap-5">
                  <SectionHeader label="Live Endpoints" title="Agent Services" icon={Cpu} />
                  <div className="flex flex-col gap-3">
                    {serviceEntries.map(([protocol, svc]) => {
                      const service = svc as { endpoint: string; version?: string; skills?: string[] }
                      return (
                        <div
                          key={protocol}
                          className="flex items-start justify-between gap-4 p-3.5 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide"
                                style={{ background: 'rgba(0,112,243,0.15)', border: '1px solid rgba(0,112,243,0.25)', color: 'var(--accent)' }}
                              >
                                {protocol}
                              </span>
                              {service.version && (
                                <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                                  v{service.version}
                                </span>
                              )}
                            </div>
                            <p className="address-mono text-xs truncate mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                              {service.endpoint}
                            </p>
                            {Array.isArray(service.skills) && service.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {service.skills.slice(0, 4).filter((sk): sk is string => typeof sk === 'string').map((sk) => (
                                  <span
                                    key={sk}
                                    className="px-1.5 py-0.5 rounded text-[10px]"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--muted-foreground)' }}
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <a
                            href={service.endpoint}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-white/[0.07]"
                            style={{ color: 'var(--muted-foreground)' }}
                            aria-label={`Open ${protocol} endpoint`}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Parse / Validation status */}
              {parseStatus && (
                <GlassCard className="p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <SectionHeader label="Validation" title="Parse Status" icon={FileCheck} />
                    <ParseStatusBadge status={parseStatus.status} />
                  </div>

                  {parseStatus.errors.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ff5252', opacity: 0.8 }}>Errors</p>
                      {parseStatus.errors.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 rounded-lg text-xs"
                          style={{ background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)' }}
                        >
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#ff5252' }} />
                          <span style={{ color: 'var(--muted-foreground)' }}>
                            <span className="font-mono text-[10px] mr-1.5" style={{ color: '#ff5252' }}>[{e.code}]</span>
                            {e.message}
                            {e.field && <span className="ml-1 opacity-60">· {e.field}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseStatus.warnings.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ffa000', opacity: 0.8 }}>Warnings</p>
                      {parseStatus.warnings.slice(0, 5).map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-3 rounded-lg text-xs"
                          style={{ background: 'rgba(255,160,0,0.05)', border: '1px solid rgba(255,160,0,0.15)' }}
                        >
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#ffa000' }} />
                          <span style={{ color: 'var(--muted-foreground)' }}>
                            <span className="font-mono text-[10px] mr-1.5" style={{ color: '#ffa000' }}>[{w.code}]</span>
                            {w.message}
                            {w.field && <span className="ml-1 opacity-60">· {w.field}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {parseStatus.info.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#00d4ff', opacity: 0.8 }}>Info</p>
                      {parseStatus.info.slice(0, 5).map((i, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-3 rounded-lg text-xs"
                          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
                        >
                          <Activity size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#00d4ff' }} />
                          <span style={{ color: 'var(--muted-foreground)' }}>
                            <span className="font-mono text-[10px] mr-1.5" style={{ color: '#00d4ff' }}>[{i.code}]</span>
                            {i.message}
                            {i.field && <span className="ml-1 opacity-60">· {i.field}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isParseOk(parseStatus.status) && parseStatus.errors.length === 0 && parseStatus.warnings.length === 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(0,200,83,0.05)', border: '1px solid rgba(0,200,83,0.15)' }}>
                      <CheckCircle size={14} style={{ color: 'var(--verified)' }} />
                      <span className="text-sm" style={{ color: 'var(--verified)' }}>All checks passed</span>
                    </div>
                  )}

                  {parseStatus.last_parsed_at && (
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock size={11} />
                      Last parsed {formatDate(parseStatus.last_parsed_at)}
                    </p>
                  )}
                </GlassCard>
              )}

              {/* Technical Information */}
              <GlassCard className="p-6 flex flex-col gap-5">
                <SectionHeader label="On-Chain Identity" title="ERC-8004 Registration" icon={Hash} />

                <div className="flex flex-col gap-0 divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {technicalRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <span className="text-xs font-medium uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                        {row.label}
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {row.mono === true ? (
                          <code className="address-mono text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                            {truncateAddress(row.value, 8)}
                          </code>
                        ) : (
                          <span className="text-sm font-medium text-right text-foreground truncate">{row.value}</span>
                        )}
                        {row.copy === true && <CopyButton text={row.value} />}
                        {row.link && (
                          <a href={row.link} target="_blank" rel="noopener noreferrer"
                            className="p-1 rounded transition-colors hover:bg-white/[0.06]"
                            style={{ color: 'var(--muted-foreground)' }}
                            aria-label="View on explorer">
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust models */}
                {agent.supported_trust_models && agent.supported_trust_models.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                      Trust Models
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.supported_trust_models.map((tm) => (
                        <span key={tm} className="px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted-foreground)' }}>
                          {tm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Creation tx */}
                {agent.created_tx_hash && (
                  <div className="rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(0,112,243,0.05)', border: '1px solid rgba(0,112,243,0.12)' }}>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                        Creation Transaction
                      </p>
                      <code className="address-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {truncateAddress(agent.created_tx_hash, 10)}
                      </code>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <CopyButton text={agent.created_tx_hash} />
                      <a
                        href={`${explorer}/tx/${agent.created_tx_hash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded transition-colors hover:bg-white/[0.06]"
                        style={{ color: 'var(--muted-foreground)' }}
                        aria-label="View creation tx on explorer"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Right sidebar — 1/3 */}
            <div className="flex flex-col gap-6">

              {/* Reputation & Feedback */}
              <GlassCard className="p-6 flex flex-col gap-5">
                <SectionHeader label="Community" title="Reputation &amp; Feedback" icon={Star} />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Feedbacks', value: agent.total_feedbacks.toLocaleString(), color: 'var(--accent)' },
                    { label: 'Avg. Score', value: agent.average_score > 0 ? `${Math.round(agent.average_score)}/100` : 'N/A', color: level.color },
                    { label: 'Stars', value: agent.star_count.toLocaleString(), color: '#ffa000' },
                    { label: 'Reputation', value: `${Math.round(agent.total_score)}/100`, color: level.color },
                  ].map((item) => (
                    <div key={item.label}
                      className="flex flex-col items-center justify-center p-3 rounded-xl gap-1 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-lg font-bold stat-number" style={{ color: item.color }}>{item.value}</span>
                      <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                {agent.total_feedbacks === 0 && (
                  <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>No feedback yet</p>
                )}
              </GlassCard>

              {/* Endpoint Health */}
              {(agent.health_score != null || agent.health_status || agent.is_endpoint_verified) && (
                <GlassCard className="p-6 flex flex-col gap-4">
                  <SectionHeader label="Uptime" title="Endpoint Health" icon={HeartPulse} />
                  <div className="flex flex-col gap-3">
                    {agent.health_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Status</span>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: agent.health_status === 'healthy' ? 'rgba(0,200,83,0.1)' : 'rgba(255,160,0,0.1)',
                            border: `1px solid ${agent.health_status === 'healthy' ? 'rgba(0,200,83,0.25)' : 'rgba(255,160,0,0.25)'}`,
                            color: agent.health_status === 'healthy' ? 'var(--verified)' : '#ffa000',
                          }}
                        >
                          {agent.health_status}
                        </span>
                      </div>
                    )}
                    {agent.health_score != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Health Score</span>
                        <span className="text-sm font-bold stat-number" style={{ color: agent.health_score > 60 ? 'var(--verified)' : '#ffa000' }}>
                          {Math.round(agent.health_score)}/100
                        </span>
                      </div>
                    )}
                    {agent.endpoint_verified_domain && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>Domain</span>
                        <a
                          href={`https://${agent.endpoint_verified_domain}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium truncate flex items-center gap-1"
                          style={{ color: 'var(--accent)' }}
                        >
                          {agent.endpoint_verified_domain}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}
                    {agent.health_checked_at && (
                      <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                        <Clock size={10} /> Checked {formatDate(agent.health_checked_at)}
                      </p>
                    )}
                    {agent.endpoint_verification_error && (
                      <div className="p-2.5 rounded-lg text-xs" style={{ background: 'rgba(255,82,82,0.05)', border: '1px solid rgba(255,82,82,0.15)', color: '#ff5252' }}>
                        {agent.endpoint_verification_error}
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}

              {/* Resources */}
              <GlassCard className="p-6 flex flex-col gap-4">
                <SectionHeader label="Links" title="Resources" icon={Globe} />
                <div className="flex flex-col gap-2">
                  <ResourceLink
                    href={`https://www.8004scan.io/agents/${chainName(agent.chain_id).toLowerCase()}/${tokenId}`}
                    icon={Globe}
                    label="View on 8004scan"
                    accent
                  />
                  <ResourceLink
                    href={`${explorer}/address/${registryAddress}`}
                    icon={Shield}
                    label="Registry Contract"
                  />
                  {agent.is_endpoint_verified && agent.endpoint_verified_domain && (
                    <ResourceLink
                      href={`https://${agent.endpoint_verified_domain}`}
                      icon={BadgeCheck}
                      label="Verified Domain"
                      green
                    />
                  )}
                  <ResourceLink
                    href="https://eips.ethereum.org/EIPS/eip-8004"
                    icon={FileCheck}
                    label="ERC-8004 Spec"
                  />
                </div>
              </GlassCard>

              {/* Validation stats */}
              {(agent.total_validations > 0 || agent.successful_validations > 0) && (
                <GlassCard className="p-6 flex flex-col gap-4">
                  <SectionHeader label="On-Chain" title="Validations" icon={Activity} />
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total</span>
                      <span className="text-sm font-bold stat-number text-foreground">{agent.total_validations.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Successful</span>
                      <span className="text-sm font-bold stat-number" style={{ color: 'var(--verified)' }}>{agent.successful_validations.toLocaleString()}</span>
                    </div>
                    {agent.total_validations > 0 && (
                      <>
                        <div className="w-full rounded-full overflow-hidden h-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(agent.successful_validations / agent.total_validations) * 100}%`,
                              background: 'var(--verified)',
                            }}
                          />
                        </div>
                        <p className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>
                          {Math.round((agent.successful_validations / agent.total_validations) * 100)}% success rate
                        </p>
                      </>
                    )}
                  </div>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, title, icon: Icon }: { label: string; title: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} style={{ color: 'var(--accent)', opacity: 0.7 }} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest leading-none mb-0.5" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
          {label}
        </p>
        <h3 className="font-semibold text-foreground text-sm" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
    </div>
  )
}

function ResourceLink({ href, icon: Icon, label, accent, green }: { href: string; icon: React.ElementType; label: string; accent?: boolean; green?: boolean }) {
  const color = accent ? 'var(--accent)' : green ? 'var(--verified)' : 'var(--muted-foreground)'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.04]"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} style={{ color }} />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <ExternalLink size={11} style={{ color: 'var(--muted-foreground)' }} />
    </a>
  )
}

function MetricTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-3 rounded-xl gap-1 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span className="text-base font-bold stat-number" style={{ color }}>{value}</span>
      <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  )
}

function ParseStatusBadge({ status }: { status: string }) {
  const map = {
    ok: { label: 'Passed', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.25)', color: 'var(--verified)' },
    success: { label: 'Passed', bg: 'rgba(0,200,83,0.1)', border: 'rgba(0,200,83,0.25)', color: 'var(--verified)' },
    warning: { label: 'Warnings', bg: 'rgba(255,160,0,0.1)', border: 'rgba(255,160,0,0.25)', color: '#ffa000' },
    error: { label: 'Errors', bg: 'rgba(255,82,82,0.1)', border: 'rgba(255,82,82,0.25)', color: '#ff5252' },
    failed: { label: 'Errors', bg: 'rgba(255,82,82,0.1)', border: 'rgba(255,82,82,0.25)', color: '#ff5252' },
  }
  const key = status.toLowerCase()
  const s = map[key as keyof typeof map]
  if (!s) return null
  return (
    <div className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </div>
  )
}

function isParseOk(status: string): boolean {
  const key = status.toLowerCase()
  return key === 'ok' || key === 'success' || key === 'passed'
}

function getSyntrophicTone(status: string | null): { color: string; bg: string; border: string } {
  if (!status) {
    return { color: 'var(--muted-foreground)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' }
  }

  const key = status.toUpperCase()
  if (key === 'BONDED') {
    return { color: 'var(--verified)', bg: 'rgba(0,200,83,0.12)', border: 'rgba(0,200,83,0.25)' }
  }
  if (key === 'SLASHED') {
    return { color: '#ff5252', bg: 'rgba(255,82,82,0.12)', border: 'rgba(255,82,82,0.25)' }
  }
  if (key === 'WITHDRAWN') {
    return { color: '#ffa000', bg: 'rgba(255,160,0,0.12)', border: 'rgba(255,160,0,0.25)' }
  }
  return { color: 'var(--accent)', bg: 'rgba(0,112,243,0.12)', border: 'rgba(0,112,243,0.25)' }
}

function formatUnixTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Not set'
  return new Date(seconds * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractSyntrophicMetadata(agent: AgentDetail): {
  status: string | null
  score: number | null
  reviewCount: number | null
  updatedAt: number | null
  validator: string | null
} {
  const onchain = agent.raw_metadata?.onchain ?? []

  const byKey = (key: string) => onchain.find((entry) => entry.key === key) ?? null

  const statusEntry = byKey('syntrophic.status')
  const scoreEntry = byKey('syntrophic.score')
  const reviewCountEntry = byKey('syntrophic.reviewCount')
  const updatedAtEntry = byKey('syntrophic.updatedAt')
  const validatorEntry = byKey('syntrophic.validator')

  const status = parseStatusValue(statusEntry?.decoded, statusEntry?.value)
  const score = parseUintValue(scoreEntry?.decoded, scoreEntry?.value)
  const reviewCount = parseUintValue(reviewCountEntry?.decoded, reviewCountEntry?.value)
  const updatedAt = parseUintValue(updatedAtEntry?.decoded, updatedAtEntry?.value)
  const validator = parseAddressValue(validatorEntry?.decoded, validatorEntry?.value)

  return { status, score, reviewCount, updatedAt, validator }
}

function parseStatusValue(decoded: unknown, value: string | undefined): string | null {
  if (typeof decoded === 'string' && decoded.length > 0) {
    return decoded.toUpperCase()
  }
  if (!value) return null
  if (!/^0x([0-9a-fA-F]{2})+$/.test(value)) return null

  let out = ''
  for (let i = 2; i < value.length; i += 2) {
    const n = Number.parseInt(value.slice(i, i + 2), 16)
    if (n === 0) continue
    if (n < 32 || n > 126) return null
    out += String.fromCharCode(n)
  }
  return out.length > 0 ? out.toUpperCase() : null
}

function parseUintValue(decoded: unknown, value: string | undefined): number | null {
  if (typeof decoded === 'number' && Number.isFinite(decoded)) {
    return Math.floor(decoded)
  }

  if (typeof decoded === 'string' && /^0x[0-9a-fA-F]+$/.test(decoded)) {
    try {
      const n = BigInt(decoded)
      if (n > BigInt(Number.MAX_SAFE_INTEGER)) return null
      return Number(n)
    } catch {
      // Fall back to primary value parser.
    }
  }

  if (!value || !/^0x[0-9a-fA-F]+$/.test(value)) return null
  try {
    const n = BigInt(value)
    if (n > BigInt(Number.MAX_SAFE_INTEGER)) return null
    return Number(n)
  } catch {
    return null
  }
}

function parseAddressValue(decoded: unknown, value: string | undefined): string | null {
  if (typeof decoded === 'string' && /^0x[0-9a-fA-F]{40}$/.test(decoded)) {
    return decoded
  }

  if (!value || !/^0x[0-9a-fA-F]+$/.test(value)) return null

  const hex = value.slice(2)
  if (hex.length >= 40) {
    const addr = `0x${hex.slice(-40)}`
    if (/^0x0{40}$/i.test(addr)) return null
    return addr
  }

  return null
}
