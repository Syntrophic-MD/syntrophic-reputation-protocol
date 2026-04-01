import { NextRequest, NextResponse } from 'next/server'

import { createOnboardingQuote } from '@/lib/onboarding/quote'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const quote = await createOnboardingQuote({
      beneficiary: body?.params?.beneficiary ?? body?.beneficiary,
      profile: body?.params?.profile ?? body?.profile,
      chain_ids: body?.context?.chain_ids ?? body?.chain_ids,
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: error instanceof Error ? error.message : 'Invalid onboarding quote request.',
          retryable: false,
        },
      },
      { status: 400 }
    )
  }
}
