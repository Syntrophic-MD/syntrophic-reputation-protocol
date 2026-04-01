import { NextRequest, NextResponse } from 'next/server'

import { loadJob } from '@/lib/onboarding/store'

export async function GET(_req: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params
  const job = await loadJob(jobId)

  if (!job) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'Job not found.',
          retryable: false,
        },
      },
      { status: 404 }
    )
  }

  return NextResponse.json(job)
}
