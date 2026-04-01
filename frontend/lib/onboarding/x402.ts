import { type NextRequest, NextResponse } from 'next/server'
import {
  HTTPFacilitatorClient,
  type HTTPAdapter,
  type HTTPProcessResult,
  type HTTPRequestContext,
  type HTTPResponseInstructions,
  type ProcessSettleResultResponse,
  x402HTTPResourceServer,
  x402ResourceServer,
} from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'

import { assertX402Config } from './config'
import { getTotalQuotePriceUsdString } from './constants'

class NextRequestAdapter implements HTTPAdapter {
  constructor(private readonly request: NextRequest) {}

  getHeader(name: string) {
    return this.request.headers.get(name) ?? undefined
  }

  getMethod() {
    return this.request.method
  }

  getPath() {
    return this.request.nextUrl.pathname
  }

  getUrl() {
    return this.request.url
  }

  getAcceptHeader() {
    return this.request.headers.get('accept') ?? 'application/json'
  }

  getUserAgent() {
    return this.request.headers.get('user-agent') ?? ''
  }
}

let serverPromise: Promise<x402HTTPResourceServer> | null = null

function buildServer() {
  const config = assertX402Config()
  const facilitator = new HTTPFacilitatorClient({
    url: config.x402FacilitatorUrl,
  })
  const resourceServer = new x402ResourceServer(facilitator).register('eip155:*', new ExactEvmScheme())
  const httpServer = new x402HTTPResourceServer(resourceServer, {
    'POST /api/onboarding/launches/*': {
      accepts: {
        scheme: 'exact',
        price: getTotalQuotePriceUsdString(),
        network: 'eip155:8453',
        payTo: config.x402PayToAddress!,
      },
      description: 'Launch a bonded ERC-8004 agent on Base',
      mimeType: 'application/json',
      unpaidResponseBody: () => ({
        contentType: 'application/json',
        body: {
          error: {
            code: 'PAYMENT_REQUIRED',
            message: 'x402 payment is required before sponsored onboarding can execute.',
            retryable: true,
          },
        },
      }),
    },
  })

  serverPromise = httpServer.initialize().then(() => httpServer)
  return serverPromise
}

export async function getX402LaunchServer() {
  if (!serverPromise) {
    return buildServer()
  }
  return serverPromise
}

export function createX402RequestContext(request: NextRequest): HTTPRequestContext {
  const adapter = new NextRequestAdapter(request)
  return {
    adapter,
    path: adapter.getPath(),
    method: adapter.getMethod(),
    paymentHeader: adapter.getHeader('PAYMENT-SIGNATURE') ?? adapter.getHeader('X-PAYMENT'),
  }
}

export function responseFromInstructions(instructions: HTTPResponseInstructions) {
  const response = NextResponse.json(instructions.body ?? {}, {
    status: instructions.status,
  })

  for (const [key, value] of Object.entries(instructions.headers)) {
    response.headers.set(key, value)
  }

  return response
}

export async function requireX402Payment(request: NextRequest): Promise<{
  context: HTTPRequestContext
  result: HTTPProcessResult
  server: x402HTTPResourceServer
}> {
  const server = await getX402LaunchServer()
  const context = createX402RequestContext(request)
  const result = await server.processHTTPRequest(context)

  return { context, result, server }
}

export async function applyX402Settlement(args: {
  server: x402HTTPResourceServer
  context: HTTPRequestContext
  verification: Extract<HTTPProcessResult, { type: 'payment-verified' }>
  responseBody: unknown
}) {
  const responseBuffer = Buffer.from(JSON.stringify(args.responseBody))

  return args.server.processSettlement(
    args.verification.paymentPayload,
    args.verification.paymentRequirements,
    args.verification.declaredExtensions,
    {
      request: args.context,
      responseBody: responseBuffer,
    }
  )
}

export function attachSettlementHeaders(
  response: NextResponse,
  settlement: Exclude<ProcessSettleResultResponse, { success: false }>
) {
  for (const [key, value] of Object.entries(settlement.headers)) {
    response.headers.set(key, value)
  }
  return response
}
