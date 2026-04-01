import { decodePaymentResponseHeader, wrapFetchWithPaymentFromConfig } from '@x402/fetch'
import { ExactEvmScheme } from '@x402/evm'
import { privateKeyToAccount } from 'viem/accounts'

const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
const payerPrivateKey = process.env.DEMO_PAYER_PRIVATE_KEY
const beneficiary = process.env.DEMO_BENEFICIARY_ADDRESS
const baseRpcUrl = process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org'

if (!payerPrivateKey) {
  console.error('Missing DEMO_PAYER_PRIVATE_KEY.')
  process.exit(1)
}

const account = privateKeyToAccount(payerPrivateKey)
const launchBeneficiary = beneficiary ?? account.address
const quoteIdArg = process.argv.find((value) => value.startsWith('--quote='))?.split('=')[1]

function getArg(name, fallback) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`))
  if (inline) return inline.split('=')[1]
  return fallback
}

async function createQuote() {
  const response = await fetch(`${appUrl}/api/onboarding/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      params: {
        beneficiary: launchBeneficiary,
        profile: {
          name: getArg('name', process.env.DEMO_AGENT_NAME ?? 'Syntrophic Demo Agent'),
          description:
            getArg(
              'description',
              process.env.DEMO_AGENT_DESCRIPTION ??
                'A hackathon demo agent launched through Syntrophic with paid ERC-8004 onboarding and bonded trust on Base.'
            ),
          image_url: getArg('image', process.env.DEMO_AGENT_IMAGE_URL),
          services: [
            {
              type: 'mcp',
              url: getArg('service', process.env.DEMO_AGENT_SERVICE_URL ?? 'https://example.com/agents/syntrophic-demo'),
            },
          ],
        },
      },
      context: {
        chain_ids: [8453],
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Quote creation failed (${response.status}): ${await response.text()}`)
  }

  return response.json()
}

async function main() {
  const quote = quoteIdArg
    ? {
        quote_id: quoteIdArg,
      }
    : await createQuote()

  const paidFetch = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: 'eip155:*',
        client: new ExactEvmScheme(account, {
          8453: { rpcUrl: baseRpcUrl },
        }),
      },
    ],
  })

  console.log(`Quote: ${quote.quote_id}`)
  console.log(`Beneficiary: ${launchBeneficiary}`)
  console.log(`Calling paid launch endpoint at ${appUrl}`)

  const response = await paidFetch(`${appUrl}/api/onboarding/launches/${quote.quote_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      params: {
        beneficiary: launchBeneficiary,
      },
      context: {
        chain_ids: [8453],
      },
    }),
  })

  const paymentHeader = response.headers.get('PAYMENT-RESPONSE')
  const data = await response.json()

  if (!response.ok) {
    console.error(JSON.stringify(data, null, 2))
    process.exit(1)
  }

  if (paymentHeader) {
    const settlement = decodePaymentResponseHeader(paymentHeader)
    console.log('Payment settlement:')
    console.log(JSON.stringify(settlement, null, 2))
  }

  console.log('Launch result:')
  console.log(JSON.stringify(data, null, 2))

  const chainResult = data?.proof_bundle?.chain_results?.[0]
  if (chainResult) {
    console.log(`Agent ID: ${chainResult.agent_id}`)
    console.log(`Tx Hash: ${chainResult.tx_hash}`)
    console.log(`Bonded: ${chainResult.bonded}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
