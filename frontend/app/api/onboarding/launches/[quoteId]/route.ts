import { NextRequest, NextResponse } from 'next/server'

import { executeLaunchDirect } from '@/lib/onboarding/jobs'
import {
  applyX402Settlement,
  attachSettlementHeaders,
  requireX402Payment,
  responseFromInstructions,
} from '@/lib/onboarding/x402'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const payment = await requireX402Payment(req)
    if (payment.result.type === 'payment-error') {
      return responseFromInstructions(payment.result.response)
    }
    if (payment.result.type !== 'payment-verified') {
      return NextResponse.json(
        {
          error: {
            code: 'PAYMENT_CONFIGURATION_ERROR',
            message: 'Launch route did not resolve to a payment-protected resource.',
            retryable: true,
          },
        },
        { status: 500 }
      )
    }

    const { quoteId } = await context.params
    const body = await req.json()
    const job = await executeLaunchDirect({
      quoteId,
      beneficiary: body?.params?.beneficiary ?? body?.beneficiary,
      chainIds: body?.context?.chain_ids ?? body?.chain_ids,
    })
    const proofBundle = job.result ? job.result.proof_bundle : null

    const responseBody = {
      operation_id: job.operation_id,
      job_id: job.job_id,
      status: job.status,
      created_at: job.created_at,
      completed_at: job.completed_at,
      proof_bundle: proofBundle,
    }

    const settlement = await applyX402Settlement({
      server: payment.server,
      context: payment.context,
      verification: payment.result,
      responseBody,
    })

    if (!settlement.success) {
      return responseFromInstructions(settlement.response)
    }

    const response = NextResponse.json(responseBody, { status: 201 })
    return attachSettlementHeaders(response, settlement)
  } catch (error) {
    const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 500
    const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : 'EXTERNAL_PROVIDER_ERROR'
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
