import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return NextResponse.json(
      {
        error: {
          code: 'USE_QUOTE_SCOPED_ROUTE',
          message:
            'Sponsored onboarding now uses a quote-scoped x402 route. POST to /api/onboarding/launches/{quote_id} with a beneficiary address.',
          retryable: false,
          details: {
            quote_id: body?.params?.quote_id ?? body?.quote_id ?? null,
          },
        },
      },
      { status: 400 }
    )
  } catch (error) {
    const status = typeof (error as { status?: unknown })?.status === 'number' ? (error as { status: number }).status : 500
    const code = typeof (error as { code?: unknown })?.code === 'string' ? (error as { code: string }).code : 'EXTERNAL_PROVIDER_ERROR'
    const details =
      typeof (error as { details?: unknown })?.details === 'object' && (error as { details?: unknown }).details !== null
        ? (error as { details: Record<string, unknown> }).details
        : undefined

    return NextResponse.json(
      {
        error: {
          code,
          message: error instanceof Error ? error.message : 'Failed to launch sponsored onboarding.',
          retryable: status >= 500,
          ...(details ? { details } : {}),
        },
      },
      { status }
    )
  }
}
