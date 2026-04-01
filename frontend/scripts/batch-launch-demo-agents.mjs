import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { decodeEventLog, hexToString, http, parseAbi, createPublicClient, createWalletClient } from 'viem'
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

const DEFAULT_VAULT_ADDRESS = '0xFdB160B2B2f2e6189895398563D907fD8239d4e3'
const DEFAULT_REGISTRY_ADDRESS = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const DEFAULT_ADAPTER_ADDRESS = '0x2ADF396943421a70088d74A8281852344606D668'
const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

const sponsoredOnboarderAbi = parseAbi([
  'function onboardFor(address beneficiary, string agentURI, bytes32 paymentRef) payable returns (uint256 agentId)',
  'event SponsoredOnboarded(uint256 indexed agentId, address indexed beneficiary, address indexed sponsor, uint256 bondAmount, string agentURI, bytes32 paymentRef)',
])

const registryAbi = parseAbi([
  'function ownerOf(uint256 agentId) view returns (address owner)',
  'function getMetadata(uint256 agentId, string metadataKey) view returns (bytes metadataValue)',
])

const vaultAbi = parseAbi([
  'function BOND_AMOUNT() view returns (uint256)',
  'function isBonded(uint256 agentId) view returns (bool)',
])

const adapterAbi = parseAbi([
  'function syncBondMetadata(uint256 agentId)',
])

function parseArgs() {
  const defaults = {
    envFile: path.resolve(process.cwd(), '..', 'agent-onboarding-demo', '.secrets', 'main.env'),
    profilesFile: path.resolve(
      process.cwd(),
      '..',
      'agent-onboarding-demo',
      'profiles',
      'syntrophic_demo_agents_223_232.json'
    ),
    walletsFile: path.resolve(
      process.cwd(),
      '..',
      'agent-onboarding-demo',
      '.secrets',
      'wallet-batches',
      'demo_agents_223_232_wallets.json'
    ),
    outDir: path.resolve(process.cwd(), '.runtime', 'demo-batch'),
    count: 10,
    mode: 'direct',
    startIndex: 0,
    serviceBaseUrl: 'https://www.syntrophic.md',
    pinataGatewayBase: DEFAULT_GATEWAY,
    rpcUrl: '',
    sponsorPrivateKey: '',
    sponsorAgentId: '36105',
    sponsoredOnboarderAddress: '',
    vaultAddress: DEFAULT_VAULT_ADDRESS,
    registryAddress: DEFAULT_REGISTRY_ADDRESS,
    adapterAddress: DEFAULT_ADAPTER_ADDRESS,
    appUrl: 'http://localhost:3000',
    dryRun: false,
  }

  const args = { ...defaults }
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i]
    if (value === '--dry-run') {
      args.dryRun = true
      continue
    }
    const [flag, inline] = value.includes('=') ? value.split('=', 2) : [value, null]
    const next = inline ?? process.argv[++i]
    switch (flag) {
      case '--env-file':
        args.envFile = path.resolve(next)
        break
      case '--profiles-file':
        args.profilesFile = path.resolve(next)
        break
      case '--wallets-file':
        args.walletsFile = path.resolve(next)
        break
      case '--out-dir':
        args.outDir = path.resolve(next)
        break
      case '--count':
        args.count = Number(next)
        break
      case '--start-index':
        args.startIndex = Number(next)
        break
      case '--mode':
        args.mode = next
        break
      case '--service-base-url':
        args.serviceBaseUrl = next
        break
      case '--pinata-gateway-base':
        args.pinataGatewayBase = next
        break
      case '--rpc-url':
        args.rpcUrl = next
        break
      case '--sponsor-private-key':
        args.sponsorPrivateKey = next
        break
      case '--sponsor-agent-id':
        args.sponsorAgentId = next
        break
      case '--sponsored-onboarder-address':
        args.sponsoredOnboarderAddress = next
        break
      case '--vault-address':
        args.vaultAddress = next
        break
      case '--registry-address':
        args.registryAddress = next
        break
      case '--adapter-address':
        args.adapterAddress = next
        break
      case '--app-url':
        args.appUrl = next
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
      default:
        throw new Error(`Unknown argument: ${flag}`)
    }
  }

  if (!Number.isInteger(args.count) || args.count <= 0) {
    throw new Error('--count must be a positive integer.')
  }
  if (!Number.isInteger(args.startIndex) || args.startIndex < 0) {
    throw new Error('--start-index must be a non-negative integer.')
  }
  if (!['direct', 'x402'].includes(args.mode)) {
    throw new Error('--mode must be direct or x402.')
  }

  return args
}

function printUsage() {
  console.log(`Usage:
  npm run demo:batch -- [options]

Options:
  --env-file <path>                    Source env file (default: agent-onboarding-demo/.secrets/main.env)
  --profiles-file <path>               Profile definitions JSON
  --wallets-file <path>                Beneficiary wallet JSON
  --count <n>                          Number of demo agents to launch
  --start-index <n>                    Start offset in the profile/wallet list
  --mode <direct|x402>                 direct = sponsor onchain, x402 = paid launch API
  --sponsor-agent-id <id>              Wallet entry used as sponsor if sponsor key not passed
  --sponsor-private-key <hex>          Explicit sponsor private key
  --sponsored-onboarder-address <addr> Live sponsored onboarder address
  --vault-address <addr>               SRPVault V2 address
  --registry-address <addr>            ERC-8004 registry address
  --adapter-address <addr>             ERC-8004 adapter address for metadata sync
  --service-base-url <url>             Base URL used to derive service links
  --pinata-gateway-base <url>          HTTPS gateway prefix for ipfs:// image URIs
  --app-url <url>                      Required for x402 mode
  --dry-run                            Preflight only`)
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

function maskAddress(value) {
  if (!value) return 'missing'
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function ipfsToHttps(value, gatewayBase) {
  if (!value) return null
  if (!value.startsWith('ipfs://')) return value
  return `${gatewayBase.replace(/\/+$/, '')}/${value.slice('ipfs://'.length)}`
}

function createPaymentRef(seed) {
  return `0x${crypto.createHash('sha256').update(seed).digest('hex')}`
}

function buildRegistrationFile(profile, beneficiary, gatewayBase, serviceBaseUrl) {
  const serviceUrl = `${serviceBaseUrl.replace(/\/+$/, '')}/agents/${profile.slug}`
  return {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: profile.name,
    description: profile.description,
    image: ipfsToHttps(profile.image_uri, gatewayBase),
    owners: [beneficiary],
    operators: [beneficiary],
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
        agentId: null,
        agentRegistry: `eip155:8453:${DEFAULT_REGISTRY_ADDRESS}`,
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

async function pinJson(jwt, payload) {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `syntrophic-demo-${crypto.randomUUID()}`,
      },
      pinataContent: payload,
    }),
  })

  if (!response.ok) {
    throw new Error(`Pinata pin failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  if (!data.IpfsHash) {
    throw new Error('Pinata response missing IpfsHash.')
  }

  return {
    cid: data.IpfsHash,
    uri: `ipfs://${data.IpfsHash}`,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryRead(fn, attempts = 5, delayMs = 1200) {
  let lastError
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) await sleep(delayMs)
    }
  }
  throw lastError
}

async function launchDirect(args, publicClient, sponsorAccount, beneficiary, profile, pinataJwt) {
  const walletClient = createWalletClient({
    account: sponsorAccount,
    chain: BASE_CHAIN,
    transport: http(args.rpcUrl),
  })

  const registrationFile = buildRegistrationFile(profile, beneficiary.address, args.pinataGatewayBase, args.serviceBaseUrl)
  const pinned = await pinJson(pinataJwt, registrationFile)
  const paymentRef = createPaymentRef(`${profile.slug}:${beneficiary.address}`)
  const bondAmount = await publicClient.readContract({
    address: args.vaultAddress,
    abi: vaultAbi,
    functionName: 'BOND_AMOUNT',
  })
  const gasPrice = await publicClient.getGasPrice()
  const estimatedGas = await publicClient.estimateContractGas({
    account: sponsorAccount,
    address: args.sponsoredOnboarderAddress,
    abi: sponsoredOnboarderAbi,
    functionName: 'onboardFor',
    args: [beneficiary.address, pinned.uri, paymentRef],
    value: bondAmount,
  })
  const gas = (estimatedGas * BigInt(12)) / BigInt(10)

  const txHash = await walletClient.writeContract({
    address: args.sponsoredOnboarderAddress,
    abi: sponsoredOnboarderAbi,
    functionName: 'onboardFor',
    args: [beneficiary.address, pinned.uri, paymentRef],
    value: bondAmount,
    account: sponsorAccount,
    chain: BASE_CHAIN,
    gas,
    gasPrice,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  let agentId = null

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: sponsoredOnboarderAbi,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName === 'SponsoredOnboarded') {
        agentId = Number(decoded.args.agentId)
        break
      }
    } catch {
      continue
    }
  }

  if (agentId === null) {
    throw new Error('Could not decode SponsoredOnboarded event.')
  }

  const owner = await retryRead(() =>
    publicClient.readContract({
      address: args.registryAddress,
      abi: registryAbi,
      functionName: 'ownerOf',
      args: [BigInt(agentId)],
    })
  )
  const bonded = await publicClient.readContract({
    address: args.vaultAddress,
    abi: vaultAbi,
    functionName: 'isBonded',
    args: [BigInt(agentId)],
  })
  let status = await publicClient.readContract({
    address: args.registryAddress,
    abi: registryAbi,
    functionName: 'getMetadata',
    args: [BigInt(agentId), 'syntrophic.status'],
  })

  if (!status || status === '0x') {
    const syncHash = await walletClient.writeContract({
      address: args.adapterAddress,
      abi: adapterAbi,
      functionName: 'syncBondMetadata',
      args: [BigInt(agentId)],
      account: sponsorAccount,
      chain: BASE_CHAIN,
      gasPrice,
    })
    await publicClient.waitForTransactionReceipt({ hash: syncHash })
    status = await retryRead(() =>
      publicClient.readContract({
        address: args.registryAddress,
        abi: registryAbi,
        functionName: 'getMetadata',
        args: [BigInt(agentId), 'syntrophic.status'],
      })
    )
  }

  return {
    beneficiary: beneficiary.address,
    beneficiary_source_agent_id: beneficiary.sourceAgentId,
    profile_number: profile.number,
    profile_name: profile.name,
    registration_uri: pinned.uri,
    tx_hash: txHash,
    agent_id: agentId,
    owner,
    bonded,
    metadata_status: status && status !== '0x' ? hexToString(status) : null,
    explorer_url: `https://basescan.org/tx/${txHash}`,
  }
}

async function launchViaX402(args, beneficiary, profile, payerPrivateKey) {
  const [{ wrapFetchWithPaymentFromConfig }, { ExactEvmScheme }, { privateKeyToAccount: toAccount }] = await Promise.all([
    import('@x402/fetch'),
    import('@x402/evm'),
    import('viem/accounts'),
  ])

  const payer = toAccount(payerPrivateKey)
  const paidFetch = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [
      {
        network: 'eip155:*',
        client: new ExactEvmScheme(payer, {
          8453: { rpcUrl: args.rpcUrl },
        }),
      },
    ],
  })

  const quoteResponse = await fetch(`${args.appUrl}/api/onboarding/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      params: {
        beneficiary: beneficiary.address,
        profile: {
          name: profile.name,
          description: profile.description,
          image_url: ipfsToHttps(profile.image_uri, args.pinataGatewayBase),
          services: [{ type: 'web', url: `${args.serviceBaseUrl.replace(/\/+$/, '')}/agents/${profile.slug}` }],
        },
      },
      context: {
        chain_ids: [8453],
      },
    }),
  })

  if (!quoteResponse.ok) {
    throw new Error(`Quote failed (${quoteResponse.status}): ${await quoteResponse.text()}`)
  }

  const quote = await quoteResponse.json()
  const response = await paidFetch(`${args.appUrl}/api/onboarding/launches/${quote.quote_id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      params: { beneficiary: beneficiary.address },
      context: { chain_ids: [8453] },
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`x402 launch failed (${response.status}): ${JSON.stringify(data)}`)
  }

  const chainResult = data?.proof_bundle?.chain_results?.[0]
  if (!chainResult) {
    throw new Error('x402 launch response missing proof bundle.')
  }

  return {
    beneficiary: beneficiary.address,
    beneficiary_source_agent_id: beneficiary.sourceAgentId,
    profile_number: profile.number,
    profile_name: profile.name,
    registration_uri: chainResult.agent_uri,
    tx_hash: chainResult.tx_hash,
    agent_id: chainResult.agent_id,
    owner: chainResult.owner,
    bonded: chainResult.bonded,
    metadata_status: chainResult.metadata_status,
    explorer_url: `https://basescan.org/tx/${chainResult.tx_hash}`,
    quote_id: quote.quote_id,
    job_id: data.job_id,
  }
}

async function assertPlainEoa(publicClient, address, label) {
  const code = await publicClient.getCode({ address })
  if (code && code !== '0x') {
    throw new Error(`${label} ${address} is not a plain EOA. Refusing to continue with a delegated/smart-account sponsor.`)
  }
}

async function main() {
  const args = parseArgs()
  const env = await parseEnvFile(args.envFile)

  args.rpcUrl = args.rpcUrl || env.BASE_RPC_URL || 'https://mainnet.base.org'
  args.sponsorPrivateKey = args.sponsorPrivateKey || env.SPONSORED_ONBOARDER_PRIVATE_KEY || ''
  args.sponsoredOnboarderAddress = args.sponsoredOnboarderAddress || env.SPONSORED_ONBOARDER_ADDRESS || ''

  const profiles = await readJson(args.profilesFile)
  const allWallets = await readJson(args.walletsFile)
  const beneficiaries = allWallets
    .filter((item) => item.agent_id !== 32055)
    .map((item) => ({
      address: item.address,
      privateKey: item.private_key,
      sourceAgentId: item.agent_id ?? null,
      name: item.name,
    }))

  const selectedProfiles = profiles.slice(args.startIndex, args.startIndex + args.count)
  const selectedBeneficiaries = beneficiaries.slice(args.startIndex, args.startIndex + args.count)

  if (selectedProfiles.length !== args.count || selectedBeneficiaries.length !== args.count) {
    throw new Error('Not enough profiles or beneficiary wallets for the requested count.')
  }

  if (!args.sponsorPrivateKey) {
    const sponsor = beneficiaries.find((item) => String(item.sourceAgentId) === String(args.sponsorAgentId))
    if (!sponsor) {
      throw new Error(`Could not find sponsor agent id ${args.sponsorAgentId} in wallets file.`)
    }
    args.sponsorPrivateKey = sponsor.privateKey
  }

  const pinataJwt = env.PINATA_JWT || process.env.PINATA_JWT || ''
  if (args.mode === 'direct' && !args.dryRun && !pinataJwt) {
    throw new Error('PINATA_JWT is required for direct batch launch mode.')
  }
  if (args.mode === 'direct' && !args.dryRun && !args.sponsoredOnboarderAddress) {
    throw new Error('SPONSORED_ONBOARDER_ADDRESS is required for direct batch launch mode.')
  }

  const sponsorAccount = privateKeyToAccount(args.sponsorPrivateKey)
  const publicClient = createPublicClient({
    chain: BASE_CHAIN,
    transport: http(args.rpcUrl),
  })

  await assertPlainEoa(publicClient, sponsorAccount.address, 'Sponsor wallet')

  const sponsorBalance = await publicClient.getBalance({ address: sponsorAccount.address })
  const bondAmount = await publicClient.readContract({
    address: args.vaultAddress,
    abi: vaultAbi,
    functionName: 'BOND_AMOUNT',
  })
  const estimatedRequired = bondAmount * BigInt(args.count) + 10000000000000n

  console.log(`Mode: ${args.mode}`)
  console.log(`Sponsor: ${sponsorAccount.address}`)
  console.log(`Sponsor balance: ${sponsorBalance} wei`)
  console.log(`Vault: ${args.vaultAddress}`)
  console.log(`Registry: ${args.registryAddress}`)
  console.log(`Sponsored onboarder: ${args.sponsoredOnboarderAddress || 'missing'}`)
  console.log(`Estimated minimum for ${args.count} launches + deploy buffer: ${estimatedRequired} wei`)

  for (const [index, profile] of selectedProfiles.entries()) {
    console.log(
      `  ${index + 1}. ${profile.name} -> ${selectedBeneficiaries[index].address}` +
        (selectedBeneficiaries[index].sourceAgentId ? ` (source ${selectedBeneficiaries[index].sourceAgentId})` : '')
    )
  }

  if (args.dryRun) {
    return
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await fs.mkdir(args.outDir, { recursive: true })
  const outFile = path.join(args.outDir, `demo-batch-${timestamp}.json`)
  const results = []

  for (const [index, profile] of selectedProfiles.entries()) {
    const beneficiary = selectedBeneficiaries[index]
    console.log(`Launching ${profile.name} for ${beneficiary.address}`)
    const result =
      args.mode === 'direct'
        ? await launchDirect(args, publicClient, sponsorAccount, beneficiary, profile, pinataJwt)
        : await launchViaX402(args, beneficiary, profile, process.env.DEMO_PAYER_PRIVATE_KEY || '')
    results.push(result)
    await fs.writeFile(outFile, JSON.stringify(results, null, 2))
    console.log(`  agent_id=${result.agent_id} tx=${result.tx_hash}`)
  }

  console.log(`Saved batch report to ${outFile}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
