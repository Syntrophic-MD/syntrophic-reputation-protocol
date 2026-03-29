import { type NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://www.8004scan.io/api/v1'

// Fields we know are safe scalars or string arrays — everything else is stripped/coerced
const SCALAR_FIELDS = new Set([
  'id','agent_id','token_id','chain_id','chain_type','contract_address',
  'is_testnet','owner_address','owner_ens','owner_username','owner_avatar_url',
  'owner_publisher_tier','owner_certified_name','name','description','image_url',
  'is_verified','star_count','x402_supported','total_score','rank',
  'health_score','total_feedbacks','average_score','created_at','updated_at',
])

function sanitizeAgent(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const key of SCALAR_FIELDS) {
    const val = raw[key]
    if (val === undefined) continue
    // Coerce any unexpected object into null so React never tries to render it
    out[key] = val !== null && typeof val === 'object' && !Array.isArray(val) ? null : val
  }

  // supported_protocols — ensure array of strings
  out.supported_protocols = Array.isArray(raw.supported_protocols)
    ? raw.supported_protocols.map((p) =>
        typeof p === 'string' ? p :
        typeof p === 'object' && p !== null
          ? String((p as Record<string,unknown>).name ?? (p as Record<string,unknown>).protocol ?? JSON.stringify(p))
          : String(p)
      )
    : []

  // cross_chain_versions — pass through only if null or array of scalars
  out.cross_chain_versions = null

  return out
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const upstream = `${API_BASE}/agents?${searchParams.toString()}`

  try {
    const res = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    if (data?.items && Array.isArray(data.items)) {
      data.items = data.items.map(sanitizeAgent)
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[v0] agents proxy error:', err)
    return NextResponse.json({ error: 'Failed to reach 8004scan API' }, { status: 502 })
  }
}
