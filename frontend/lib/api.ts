// ─── 8004scan.io API client ───────────────────────────────────────────────────
// Base URL: https://www.8004scan.io/api/v1
// Docs:     https://www.8004scan.io/developers

export const API_BASE = 'https://www.8004scan.io/api/v1'

// Internal proxy base — used by client-side fetchers to avoid CORS
const PROXY_BASE = '/api/agents'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Agent8004 {
  id: string
  agent_id: string          // e.g. "8453:0x8004...registry...:1380"
  token_id: string
  chain_id: number
  chain_type: string
  contract_address: string
  is_testnet: boolean
  owner_address: string
  owner_ens: string | null
  owner_username: string | null
  owner_avatar_url: string | null
  owner_publisher_tier: string | null
  owner_certified_name: string | null
  name: string
  description: string | null
  image_url: string | null
  is_verified: boolean
  star_count: number
  supported_protocols: string[]
  x402_supported: boolean
  total_score: number        // 0–100 reputation score
  rank: number | null
  health_score: number | null
  total_feedbacks: number
  average_score: number      // 0–100 average feedback score
  cross_chain_versions: null | unknown
  created_at: string
  updated_at: string
}

export interface AgentDetail extends Agent8004 {
  raw_metadata: {
    onchain: Array<{
      key: string
      value: string
      decoded: unknown
    }>
    offchain_uri: string | null
    offchain_content: unknown | null
  } | null
  field_sources: Record<string, string | null> | null
  agent_type: string | null
  tags: string[]
  categories: string[]
  services: {
    a2a?: { endpoint: string; version: string; skills: string[] }
    web?: { endpoint: string }
    mcp?: { endpoint: string }
    oasf?: { endpoint: string }
    email?: { endpoint: string }
  } | null
  scores: null | Record<string, number>
  cross_chain_links: string[]
  created_block_number: number | null
  created_tx_hash: string | null
  is_endpoint_verified: boolean
  endpoint_verified_at: string | null
  endpoint_verified_domain: string | null
  endpoint_verification_error: string | null
  endpoint_last_checked_at: string | null
  is_active: boolean
  supported_trust_models: string[]
  health_status: string | null
  health_checked_at: string | null
  total_validations: number
  successful_validations: number
  parse_status: {
    status: string
    info: { code: string; field: string; message: string; source?: string }[]
    errors: { code: string; field: string; message: string; source?: string }[]
    warnings: { code: string; field: string; message: string; source?: string }[]
    last_parsed_at: string | null
  } | null
}

export interface AgentsResponse {
  items: Agent8004[]
  total: number
  limit: number
  offset: number
}

export type SortBy = 'total_score' | 'star_count' | 'total_feedbacks' | 'average_score' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export interface AgentsQuery {
  page?: number
  page_size?: number
  search?: string
  sort_by?: SortBy
  sort_order?: SortOrder
  is_testnet?: boolean
  chain_id?: number
  is_verified?: boolean
}

// ─── Sanitize agent list items ────────────────────────────────────────────────
// The real API sometimes returns unexpected objects in scalar fields.
// This normalizes every Agent8004 item before it reaches React.
function sanitizeAgent(raw: Record<string, unknown>): Agent8004 {
  const str = (v: unknown): string | null =>
    v == null ? null : typeof v === 'string' ? v : typeof v === 'object' ? null : String(v)
  const num = (v: unknown): number =>
    v == null || typeof v === 'object' ? 0 : Number(v) || 0
  const numOrNull = (v: unknown): number | null =>
    v == null || typeof v === 'object' ? null : Number(v) || null
  const bool = (v: unknown): boolean => Boolean(v) && typeof v !== 'object'
  const protocols = (v: unknown): string[] => {
    if (!Array.isArray(v)) return []
    return v.map((p) =>
      typeof p === 'string' ? p :
      typeof p === 'object' && p !== null
        ? String((p as Record<string,unknown>).name ?? (p as Record<string,unknown>).protocol ?? JSON.stringify(p))
        : String(p)
    )
  }

  return {
    id: str(raw.id) ?? '',
    agent_id: str(raw.agent_id) ?? '',
    token_id: str(raw.token_id) ?? '',
    chain_id: num(raw.chain_id),
    chain_type: str(raw.chain_type) ?? '',
    contract_address: str(raw.contract_address) ?? '',
    is_testnet: bool(raw.is_testnet),
    owner_address: str(raw.owner_address) ?? '',
    owner_ens: str(raw.owner_ens),
    owner_username: str(raw.owner_username),
    owner_avatar_url: str(raw.owner_avatar_url),
    owner_publisher_tier: str(raw.owner_publisher_tier),
    owner_certified_name: str(raw.owner_certified_name),
    name: str(raw.name) ?? '',
    description: str(raw.description),
    image_url: str(raw.image_url),
    is_verified: bool(raw.is_verified),
    star_count: num(raw.star_count),
    supported_protocols: protocols(raw.supported_protocols),
    x402_supported: bool(raw.x402_supported),
    total_score: num(raw.total_score),
    rank: numOrNull(raw.rank),
    health_score: numOrNull(raw.health_score),
    total_feedbacks: num(raw.total_feedbacks),
    average_score: num(raw.average_score),
    cross_chain_versions: null,
    created_at: str(raw.created_at) ?? '',
    updated_at: str(raw.updated_at) ?? '',
  }
}



export async function fetchAgents(query: AgentsQuery = {}): Promise<AgentsResponse> {
  const {
    page = 1,
    page_size = 20,
    search,
    sort_by = 'total_score',
    sort_order = 'desc',
    is_testnet,
    chain_id,
    is_verified,
  } = query

  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('page_size', String(page_size))
  params.set('sort_by', sort_by)
  params.set('sort_order', sort_order)
  if (is_testnet !== undefined) params.set('is_testnet', String(is_testnet))
  if (search) params.set('search', search)
  if (chain_id !== undefined) params.set('chain_id', String(chain_id))
  if (is_verified !== undefined) params.set('is_verified', String(is_verified))

  const res = await fetch(`${PROXY_BASE}?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`)
  const data = await res.json()
  return {
    ...data,
    items: Array.isArray(data.items)
      ? data.items.map((item: Record<string, unknown>) => sanitizeAgent(item))
      : [],
  }
}

export async function fetchAgent(agentId: string): Promise<AgentDetail> {
  // agentId format: "{chainId}:{registry}:{tokenId}"
  // The upstream detail endpoint is: GET /agents/{chainId}/{registry}/{tokenId}
  const parts = agentId.split(':')
  const chainId = parts[0]
  const registry = parts[1]
  const tokenId = parts[2]

  if (!chainId || !registry || !tokenId) {
    throw new Error(`Invalid agentId format: ${agentId}`)
  }

  const url = `${API_BASE}/agents/${chainId}/${registry}/${tokenId}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Failed to fetch agent ${agentId}: ${res.status}`)
  const raw = await res.json()
  // Sanitize the base Agent8004 scalar fields; preserve AgentDetail-specific fields
  const base = sanitizeAgent(raw as Record<string, unknown>)

  const parseIssueArray = (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value
      .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        code: typeof item.code === 'string' ? item.code : '',
        field: typeof item.field === 'string' ? item.field : '',
        message: typeof item.message === 'string' ? item.message : '',
        ...(typeof item.source === 'string' ? { source: item.source } : {}),
      }))
  }

  const parseStatus = raw.parse_status && typeof raw.parse_status === 'object' && !Array.isArray(raw.parse_status)
    ? {
        status: typeof (raw.parse_status as Record<string, unknown>).status === 'string'
          ? (raw.parse_status as Record<string, unknown>).status as string
          : 'unknown',
        info: parseIssueArray((raw.parse_status as Record<string, unknown>).info),
        errors: parseIssueArray((raw.parse_status as Record<string, unknown>).errors),
        warnings: parseIssueArray((raw.parse_status as Record<string, unknown>).warnings),
        last_parsed_at: typeof (raw.parse_status as Record<string, unknown>).last_parsed_at === 'string'
          ? (raw.parse_status as Record<string, unknown>).last_parsed_at as string
          : null,
      }
    : null

  const rawMetadata = raw.raw_metadata && typeof raw.raw_metadata === 'object' && !Array.isArray(raw.raw_metadata)
    ? {
        onchain: Array.isArray((raw.raw_metadata as Record<string, unknown>).onchain)
          ? ((raw.raw_metadata as Record<string, unknown>).onchain as unknown[])
              .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry))
              .map((entry) => ({
                key: typeof entry.key === 'string' ? entry.key : '',
                value: typeof entry.value === 'string' ? entry.value : '',
                decoded: entry.decoded ?? null,
              }))
              .filter((entry) => entry.key.length > 0)
          : [],
        offchain_uri: typeof (raw.raw_metadata as Record<string, unknown>).offchain_uri === 'string'
          ? (raw.raw_metadata as Record<string, unknown>).offchain_uri as string
          : null,
        offchain_content: (raw.raw_metadata as Record<string, unknown>).offchain_content ?? null,
      }
    : null

  const fieldSources = raw.field_sources && typeof raw.field_sources === 'object' && !Array.isArray(raw.field_sources)
    ? Object.fromEntries(
        Object.entries(raw.field_sources as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? v : null])
      )
    : null

  return {
    ...base,
    raw_metadata: rawMetadata,
    field_sources: fieldSources,
    agent_type: typeof raw.agent_type === 'string' ? raw.agent_type : null,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === 'string') : [],
    categories: Array.isArray(raw.categories) ? raw.categories.filter((c: unknown) => typeof c === 'string') : [],
    services: raw.services && typeof raw.services === 'object' && !Array.isArray(raw.services) ? raw.services : null,
    scores: raw.scores && typeof raw.scores === 'object' && !Array.isArray(raw.scores) ? raw.scores : null,
    cross_chain_links: Array.isArray(raw.cross_chain_links) ? raw.cross_chain_links.filter((l: unknown) => typeof l === 'string') : [],
    created_block_number: raw.created_block_number != null && typeof raw.created_block_number !== 'object' ? Number(raw.created_block_number) : null,
    created_tx_hash: typeof raw.created_tx_hash === 'string' ? raw.created_tx_hash : null,
    is_endpoint_verified: Boolean(raw.is_endpoint_verified) && typeof raw.is_endpoint_verified !== 'object',
    endpoint_verified_at: typeof raw.endpoint_verified_at === 'string' ? raw.endpoint_verified_at : null,
    endpoint_verified_domain: typeof raw.endpoint_verified_domain === 'string' ? raw.endpoint_verified_domain : null,
    endpoint_verification_error: typeof raw.endpoint_verification_error === 'string' ? raw.endpoint_verification_error : null,
    endpoint_last_checked_at: typeof raw.endpoint_last_checked_at === 'string' ? raw.endpoint_last_checked_at : null,
    is_active: Boolean(raw.is_active) && typeof raw.is_active !== 'object',
    supported_trust_models: Array.isArray(raw.supported_trust_models) ? raw.supported_trust_models.filter((t: unknown) => typeof t === 'string') : [],
    health_status: typeof raw.health_status === 'string' ? raw.health_status : null,
    health_checked_at: typeof raw.health_checked_at === 'string' ? raw.health_checked_at : null,
    total_validations: typeof raw.total_validations === 'number' ? raw.total_validations : 0,
    successful_validations: typeof raw.successful_validations === 'number' ? raw.successful_validations : 0,
    parse_status: parseStatus,
  } as AgentDetail
}

// ─── SWR key helpers ──────────────────────────────────────────────────────────

export function agentsKey(query: AgentsQuery) {
  return ['/api/v1/agents', query] as const
}

export function agentKey(agentId: string) {
  return `/api/v1/agents/${agentId}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Registry contract address by chain_id */
export const REGISTRY_BY_CHAIN: Record<number, string> = {
  8453:    '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  1:       '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  42161:   '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  10:      '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  137:     '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  42220:   '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  56:      '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  84532:   '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432',
  97:      '0x8004a818bfb912233c491871b3d84c89a494bd9e',
}

/** Map of URL slug → chain_id */
export const CHAIN_SLUG_TO_ID: Record<string, number> = {
  ethereum:        1,
  optimism:        10,
  bsc:             56,
  'bsc-testnet':   97,
  gnosis:          100,
  solana:          101,
  'solana-devnet': 103,
  polygon:         137,
  base:            8453,
  arbitrum:        42161,
  avalanche:       43114,
  celo:            42220,
  linea:           59144,
  scroll:          534352,
  zksync:          324,
  'base-sepolia':  84532,
  'op-sepolia':    11155420,
  sepolia:         11155111,
}

/** Map of chain_id → URL slug */
export const CHAIN_ID_TO_SLUG: Record<number, string> = Object.fromEntries(
  Object.entries(CHAIN_SLUG_TO_ID).map(([slug, id]) => [id, slug])
) as Record<number, string>

/** Derive a display-friendly chain name from chain_id */
export function chainName(chainId: number): string {
  const names: Record<number, string> = {
    1:        'Ethereum',
    10:       'Optimism',
    56:       'BSC',
    97:       'BSC Testnet',
    100:      'Gnosis',
    101:      'Solana',
    137:      'Polygon',
    8453:     'Base',
    42161:    'Arbitrum',
    43114:    'Avalanche',
    42220:    'Celo',
    59144:    'Linea',
    534352:   'Scroll',
    324:      'zkSync',
    84532:    'Base Sepolia',
    11155420: 'OP Sepolia',
    11155111: 'Sepolia',
  }
  return names[chainId] ?? `Chain ${chainId}`
}

/** Return avatar initials from agent name */
export function agentInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
