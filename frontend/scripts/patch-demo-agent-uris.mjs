import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { createPublicClient, createWalletClient, http, parseEther, parseGwei } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const BASE_CHAIN = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
}

const REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const TOP_UP_AMOUNT_WEI = parseEther('0.00002')
const MAX_RETRIES = 5

const registryAbi = [
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: 'uri', type: 'string' }],
  },
  {
    type: 'function',
    name: 'setAgentURI',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'agentURI', type: 'string' },
    ],
    outputs: [],
  },
]

function argValue(name, fallback = '') {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`))
  if (inline) return inline.split('=').slice(1).join('=')
  return fallback
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function parseEnvFile(file) {
  const env = {}
  try {
    const raw = await fs.readFile(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
      const [key, ...rest] = line.split('=')
      env[key.trim()] = rest.join('=').trim().replace(/^"|"$/g, '')
    }
  } catch {
    return env
  }
  return env
}

function normalizeUrl(url) {
  const parsed = new URL(url)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Invalid URL: ${url}`)
  }
  return parsed.toString()
}

function ipfsToHttps(value, gatewayBase) {
  if (!value) return null
  if (!value.startsWith('ipfs://')) return value
  return `${gatewayBase.replace(/\/+$/, '')}/${value.slice('ipfs://'.length)}`
}

function buildRegistrationFile(profile, owner, agentId, gatewayBase, serviceBaseUrl) {
  const serviceUrl = `${serviceBaseUrl.replace(/\/+$/, '')}/agents/${profile.slug}`
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: profile.name,
    description: profile.description,
    image: ipfsToHttps(profile.image_uri, gatewayBase),
    owners: [owner],
    operators: [owner],
    active: true,
    x402support: true,
    supportedTrust: ['reputation', 'crypto-economic'],
    services: [
      {
        name: 'web',
        endpoint: serviceUrl,
        type: 'web',
        url: serviceUrl,
      },
    ],
    registrations: [
      {
        agentId,
        agentRegistry: `eip155:8453:${REGISTRY_ADDRESS}`,
      },
    ],
    metadata: {
      'syntrophic.onboarding': 'demo-batch-sponsored',
      'syntrophic.launchMode': 'base-sponsored',
      'syntrophic.profileNumber': String(profile.number),
      'syntrophic.title': profile.title,
      'syntrophic.tags': (profile.tags || []).join(','),
    },
    updatedAt: new Date().toISOString(),
  }
}

async function pinJson(jwt, payload, name) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name,
      },
      pinataContent: payload,
    }),
  })

  if (!response.ok) {
    throw new Error(`Pinata pin failed (${response.status}): ${await response.text()}`)
  }

  const data = await response.json()
  if (!data?.IpfsHash) {
    throw new Error('Pinata response missing IpfsHash.')
  }

  return `ipfs://${data.IpfsHash}`
}

async function retry(label, fn) {
  let lastError = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const retryable =
        /rate limit|429|timeout|temporarily unavailable|network/i.test(message)
      if (!retryable || attempt === MAX_RETRIES) {
        throw error
      }
      const waitMs = attempt * 1500
      console.warn(`${label} failed (${message}). Retrying in ${waitMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }
  throw lastError
}

function byLowerAddress(entries) {
  return new Map(entries.map((entry) => [entry.address.toLowerCase(), entry]))
}

async function main() {
  const root = path.resolve(process.cwd(), '..')
  const envFile = argValue('env-file', path.join(process.cwd(), '.env.local'))
  const profilesFile = argValue(
    'profiles-file',
    path.join(root, 'agent-onboarding-demo', 'profiles', 'syntrophic_demo_agents_223_232.json')
  )
  const walletsFile = argValue(
    'wallets-file',
    path.join(root, 'agent-onboarding-demo', '.secrets', 'wallet-batches', 'demo_agents_223_232_wallets.json')
  )
  const reportFile = argValue(
    'report-file',
    path.join(process.cwd(), '.runtime', 'demo-batch', 'demo-batch-full-38326-38335.json')
  )
  const outFile = argValue(
    'out-file',
    path.join(process.cwd(), '.runtime', 'demo-batch', `patched-agent-uris-${Date.now()}.json`)
  )
  const gatewayBase = argValue('pinata-gateway-base', DEFAULT_GATEWAY)
  const serviceBaseUrl = argValue('service-base-url', 'https://syntrophic.md')
  const rpcUrlArg = argValue('rpc-url', '')

  const env = {
    ...(await parseEnvFile(envFile)),
    ...process.env,
  }

  const sponsorPrivateKey = env.SPONSORED_ONBOARDER_PRIVATE_KEY ?? env.PRIVATE_KEY
  const pinataJwt = env.PINATA_JWT
  const rpcUrl = rpcUrlArg || env.BASE_RPC_URL || env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'

  if (!sponsorPrivateKey) {
    throw new Error('Missing SPONSORED_ONBOARDER_PRIVATE_KEY or PRIVATE_KEY.')
  }
  if (!pinataJwt) {
    throw new Error('Missing PINATA_JWT.')
  }

  const sponsorAccount = privateKeyToAccount(sponsorPrivateKey)
  const sponsorWallet = createWalletClient({
    account: sponsorAccount,
    chain: BASE_CHAIN,
    transport: http(rpcUrl),
  })
  const publicClient = createPublicClient({
    chain: BASE_CHAIN,
    transport: http(rpcUrl),
  })

  const profiles = await readJson(profilesFile)
  const wallets = await readJson(walletsFile)
  const report = await readJson(reportFile)

  const walletByAddress = byLowerAddress(wallets)
  const reportByProfileNumber = new Map(report.map((entry) => [Number(entry.profile_number), entry]))

  const targets = []
  for (const profile of profiles) {
    const existingWallet = wallets.find((entry) => Number(entry.agent_id) === Number(profile.agent_id))
    if (profile.agent_id && existingWallet) {
      targets.push({
        profile,
        agentId: Number(profile.agent_id),
        owner: existingWallet.address,
        privateKey: existingWallet.private_key,
      })
    }

    const launched = reportByProfileNumber.get(Number(profile.number))
    if (launched) {
      const wallet = walletByAddress.get(launched.owner.toLowerCase())
      if (!wallet) {
        throw new Error(`Missing wallet for launched agent owner ${launched.owner}`)
      }
      targets.push({
        profile,
        agentId: Number(launched.agent_id),
        owner: launched.owner,
        privateKey: wallet.private_key,
      })
    }
  }

  const results = []
  for (const target of targets) {
    const ownerAccount = privateKeyToAccount(target.privateKey)
    if (ownerAccount.address.toLowerCase() !== target.owner.toLowerCase()) {
      throw new Error(`Owner key mismatch for agent ${target.agentId}`)
    }

    const ownerBalance = await retry(`balance ${ownerAccount.address}`, () =>
      publicClient.getBalance({ address: ownerAccount.address })
    )
    const actions = []

    if (ownerBalance < TOP_UP_AMOUNT_WEI) {
      const topUpHash = await retry(`top up ${ownerAccount.address}`, () => sponsorWallet.sendTransaction({
        to: ownerAccount.address,
        value: TOP_UP_AMOUNT_WEI,
        chain: BASE_CHAIN,
        maxFeePerGas: parseGwei('0.02'),
        maxPriorityFeePerGas: parseGwei('0.001'),
      }))
      await retry(`wait top up ${ownerAccount.address}`, () =>
        publicClient.waitForTransactionReceipt({ hash: topUpHash })
      )
      actions.push({ top_up_hash: topUpHash })
    }

    const ownerOnChain = await retry(`ownerOf ${target.agentId}`, () =>
      publicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'ownerOf',
        args: [BigInt(target.agentId)],
      })
    )
    if (ownerOnChain.toLowerCase() !== ownerAccount.address.toLowerCase()) {
      throw new Error(`Owner mismatch onchain for agent ${target.agentId}`)
    }

    const payload = buildRegistrationFile(
      target.profile,
      ownerAccount.address,
      target.agentId,
      gatewayBase,
      serviceBaseUrl
    )
    const uri = await pinJson(
      pinataJwt,
      payload,
      `syntrophic-agent-${target.profile.number}-patch-${crypto.randomUUID()}`
    )

    const ownerWallet = createWalletClient({
      account: ownerAccount,
      chain: BASE_CHAIN,
      transport: http(rpcUrl),
    })

    const txHash = await retry(`setAgentURI ${target.agentId}`, () =>
      ownerWallet.writeContract({
        address: REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'setAgentURI',
        args: [BigInt(target.agentId), uri],
        chain: BASE_CHAIN,
        maxFeePerGas: parseGwei('0.02'),
        maxPriorityFeePerGas: parseGwei('0.001'),
      })
    )
    await retry(`wait setAgentURI ${target.agentId}`, () =>
      publicClient.waitForTransactionReceipt({ hash: txHash })
    )

    const currentUri = await retry(`tokenURI ${target.agentId}`, () =>
      publicClient.readContract({
        address: REGISTRY_ADDRESS,
        abi: registryAbi,
        functionName: 'tokenURI',
        args: [BigInt(target.agentId)],
      })
    )

    results.push({
      profile_number: target.profile.number,
      profile_name: target.profile.name,
      agent_id: target.agentId,
      owner: ownerAccount.address,
      new_uri: uri,
      onchain_uri: currentUri,
      update_tx_hash: txHash,
      ...Object.fromEntries(actions.flatMap((entry) => Object.entries(entry))),
    })

    console.log(`Patched agent ${target.agentId} -> ${uri}`)
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true })
  await fs.writeFile(outFile, JSON.stringify(results, null, 2))
  console.log(`Wrote patch report to ${outFile}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
