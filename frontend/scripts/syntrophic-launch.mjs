import fs from 'node:fs/promises'

import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm'
import { privateKeyToAccount } from 'viem/accounts'

const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
const baseRpcUrl = process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org'
const payerPrivateKey = process.env.X402_PAYER_PRIVATE_KEY ?? process.env.DEMO_PAYER_PRIVATE_KEY
const defaultBeneficiary =
  process.env.ONBOARDING_BENEFICIARY_ADDRESS ??
  process.env.DEMO_BENEFICIARY_ADDRESS ??
  null

function printHelp() {
  console.log(`Syntrophic launch helper

Usage:
  node scripts/syntrophic-launch.mjs [options]

Options:
  --beneficiary=0x...         Wallet that should own the ERC-8004 agent
  --name="Agent Name"         Agent display name
  --description="..."         Agent description
  --service=https://...       Primary agent service URL
  --image=https://...         Optional HTTPS image URL
  --profile-file=path.json    JSON file with profile fields
  --quote=quote_id            Reuse an existing quote instead of creating a new one
  --quote-only                Only create and print the quote
  --handoff-file=path.json    Write a handoff package for a payment-capable helper
  --json                      Print raw JSON responses in addition to the summary
  --app-url=https://...       Override APP_URL
  --rpc-url=https://...       Override BASE_RPC_URL
  --help                      Show this help

Environment:
  APP_URL
  BASE_RPC_URL
  X402_PAYER_PRIVATE_KEY      Preferred payer key env
  DEMO_PAYER_PRIVATE_KEY      Backward-compatible payer key env
  ONBOARDING_BENEFICIARY_ADDRESS
  DEMO_BENEFICIARY_ADDRESS
  ONBOARDING_HANDOFF_FILE
`)
}

function getArg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`))
  if (inline) return inline.split('=').slice(1).join('=')
  return fallback
}

async function loadProfileFromFile(file) {
  if (!file) return {}
  const raw = await fs.readFile(file, 'utf8')
  return JSON.parse(raw)
}

function normalizeService(service) {
  if (typeof service === 'string') {
    return { type: 'mcp', url: service }
  }
  return service
}

function buildProfile(profileFromFile) {
  const services =
    Array.isArray(profileFromFile.services) && profileFromFile.services.length > 0
      ? profileFromFile.services.map(normalizeService)
      : [
          {
            type: 'mcp',
            url:
              getArg('service', process.env.ONBOARDING_AGENT_SERVICE_URL ?? process.env.DEMO_AGENT_SERVICE_URL) ??
              'https://example.com/agents/syntrophic-demo',
          },
        ]

  return {
    name:
      getArg('name', process.env.ONBOARDING_AGENT_NAME ?? process.env.DEMO_AGENT_NAME) ??
      profileFromFile.name ??
      'Syntrophic Demo Agent',
    description:
      getArg('description', process.env.ONBOARDING_AGENT_DESCRIPTION ?? process.env.DEMO_AGENT_DESCRIPTION) ??
      profileFromFile.description ??
      'A Syntrophic onboarding helper launching an ERC-8004 identity with bonded trust on Base.',
    image_url:
      getArg('image', process.env.ONBOARDING_AGENT_IMAGE_URL ?? process.env.DEMO_AGENT_IMAGE_URL) ??
      profileFromFile.image_url ??
      profileFromFile.image ??
      undefined,
    services,
  }
}

function buildHandoffPackage({ baseUrl, rpcUrl, beneficiary, quote, profile }) {
  return {
    mode: 'payment-handoff',
    quote_id: quote.quote_id,
    beneficiary,
    app_url: baseUrl,
    rpc_url: rpcUrl,
    profile,
    next_step:
      'A payment-capable helper should run the launch step with X402_PAYER_PRIVATE_KEY and the quote_id above.',
    helper_command:
      `X402_PAYER_PRIVATE_KEY=0xYOUR_PAYER_KEY npm run launch:agent -- --quote=${quote.quote_id} --beneficiary=${beneficiary} --app-url=${baseUrl} --rpc-url=${rpcUrl}`,
  }
}

async function maybeWriteHandoffFile(handoffFile, handoff) {
  if (!handoffFile) return
  await fs.writeFile(handoffFile, JSON.stringify(handoff, null, 2))
}

function assertRequired(value, message) {
  if (!value) {
    throw new Error(message)
  }
  return value
}

async function createQuote({ baseUrl, beneficiary, profile }) {
  const response = await fetch(`${baseUrl}/api/onboarding/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      params: {
        beneficiary,
        profile,
      },
      context: {
        chain_ids: [8453],
      },
    }),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(`Quote creation failed (${response.status}): ${raw}`)
  }

  return JSON.parse(raw)
}

async function launchQuote({ baseUrl, quoteId, beneficiary, account, rpcUrl }) {
  const paidFetch = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: 'eip155:*',
        client: new ExactEvmScheme(account, {
          8453: { rpcUrl },
        }),
      },
    ],
  })

  const response = await paidFetch(`${baseUrl}/api/onboarding/launches/${quoteId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      params: {
        beneficiary,
      },
      context: {
        chain_ids: [8453],
      },
    }),
  })

  const paymentHeader = response.headers.get('PAYMENT-RESPONSE')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      `Launch failed (${response.status}): ${JSON.stringify(data)}`
    )
  }

  return {
    settlement: paymentHeader ? decodePaymentResponseHeader(paymentHeader) : null,
    data,
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    process.exit(0)
  }

  const baseUrl = getArg('app-url', appUrl)
  const rpcUrl = getArg('rpc-url', baseRpcUrl)
  const beneficiary = getArg('beneficiary', defaultBeneficiary)
  const quoteId = getArg('quote')
  const quoteOnly = process.argv.includes('--quote-only')
  const jsonMode = process.argv.includes('--json')
  const profileFile = getArg('profile-file')
  const handoffFile = getArg('handoff-file', process.env.ONBOARDING_HANDOFF_FILE)
  const profileFromFile = await loadProfileFromFile(profileFile)
  const profile = buildProfile(profileFromFile)

  assertRequired(beneficiary, 'Missing beneficiary address. Set --beneficiary or ONBOARDING_BENEFICIARY_ADDRESS.')

  const quote = quoteId ? { quote_id: quoteId } : await createQuote({ baseUrl, beneficiary, profile })

  console.log(`Quote: ${quote.quote_id}`)
  console.log(`Beneficiary: ${beneficiary}`)

  if (jsonMode) {
    console.log(JSON.stringify({ quote }, null, 2))
  }

  if (quoteOnly) {
    const handoff = buildHandoffPackage({ baseUrl, rpcUrl, beneficiary, quote, profile })
    await maybeWriteHandoffFile(handoffFile, handoff)
    return
  }

  if (!payerPrivateKey) {
    const handoff = buildHandoffPackage({ baseUrl, rpcUrl, beneficiary, quote, profile })
    await maybeWriteHandoffFile(handoffFile, handoff)
    console.log('Payment capability not available in this environment.')
    console.log('Handoff package:')
    console.log(JSON.stringify(handoff, null, 2))
    return
  }

  const account = privateKeyToAccount(payerPrivateKey)
  console.log(`Payer: ${account.address}`)
  console.log(`Calling paid launch endpoint at ${baseUrl}`)

  const result = await launchQuote({
    baseUrl,
    quoteId: quote.quote_id,
    beneficiary,
    account,
    rpcUrl,
  })

  if (result.settlement) {
    console.log('Payment settlement:')
    console.log(JSON.stringify(result.settlement, null, 2))
  }

  const proof = result.data?.proof_bundle ?? null
  const chainResult = proof?.chain_results?.[0] ?? null

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2))
  }

  if (chainResult) {
    console.log(`Agent ID: ${chainResult.agent_id}`)
    console.log(`Tx Hash: ${chainResult.tx_hash}`)
    console.log(`Bonded: ${chainResult.bonded}`)
  }

  if (proof?.verification_url) {
    console.log(`Verification URL: ${proof.verification_url}`)
  }

  if (proof?.verification_line) {
    console.log(`Verification Line: ${proof.verification_line}`)
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  if (/no supported payment kinds loaded from any facilitator/i.test(message)) {
    console.error(
      'x402 initialization failed. This environment can create quotes, but the payment-capable client layer is not ready yet.'
    )
  }
  process.exit(1)
})
