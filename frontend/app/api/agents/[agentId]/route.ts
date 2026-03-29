import { type NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://www.8004scan.io/api/v1'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  // Decode in case the proxy received a percent-encoded agentId, then pass with literal colons
  const decoded = decodeURIComponent(agentId)
  const upstream = `${API_BASE}/agents/${decoded}`

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
    return NextResponse.json(data)
  } catch (err) {
    console.error('[v0] agent proxy error:', err)
    return NextResponse.json({ error: 'Failed to reach 8004scan API' }, { status: 502 })
  }
}
