import { privateKeyToAccount } from 'viem/accounts'
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  hexToString,
  http,
  parseAbi,
} from 'viem'

import { assertLaunchConfig } from './config'
import { ERC8004_REGISTRY_ADDRESS, SRP_REGISTRY_ADAPTER_ADDRESS, SRP_VAULT_ADDRESS } from './constants'

const base = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
} as const

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
  'function getBondStatus(uint256 agentId) view returns ((bool isBonded,address staker,uint256 bondAmount,uint256 bondedAt,uint256 score,uint256 reviewCount,uint256 unlockBlock,uint256 stakeId,uint256 cooldownEndsAt))',
])

const adapterAbi = parseAbi([
  'function syncBondMetadata(uint256 agentId)',
])

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function retry<T>(fn: () => Promise<T>, attempts = 5, delayMs = 1200): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < attempts - 1) await sleep(delayMs)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Retry attempts exhausted.')
}

export async function executeSponsoredOnboarding(input: {
  beneficiary: `0x${string}`
  agentUri: string
  paymentRef: `0x${string}`
}) {
  const config = assertLaunchConfig()
  const account = privateKeyToAccount(config.sponsorPrivateKey!)
  const transport = http(config.baseRpcUrl)
  const publicClient = createPublicClient({ chain: base, transport })
  const walletClient = createWalletClient({ account, chain: base, transport })

  const bondAmount = await publicClient.readContract({
    address: SRP_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: 'BOND_AMOUNT',
  })
  const gasPrice = await publicClient.getGasPrice()
  const estimatedGas = await publicClient.estimateContractGas({
    account,
    address: config.sponsoredOnboarderAddress!,
    abi: sponsoredOnboarderAbi,
    functionName: 'onboardFor',
    args: [input.beneficiary, input.agentUri, input.paymentRef],
    value: bondAmount,
  })
  const gas = (estimatedGas * BigInt(12)) / BigInt(10)

  const hash = await walletClient.writeContract({
    address: config.sponsoredOnboarderAddress!,
    abi: sponsoredOnboarderAbi,
    functionName: 'onboardFor',
    args: [input.beneficiary, input.agentUri, input.paymentRef],
    value: bondAmount,
    account,
    chain: base,
    gas,
    gasPrice,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  let agentId: bigint | null = null
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: sponsoredOnboarderAbi,
        data: log.data,
        topics: log.topics,
      })
      if (decoded.eventName === 'SponsoredOnboarded') {
        agentId = decoded.args.agentId
        break
      }
    } catch {
      continue
    }
  }

  if (agentId === null) {
    throw new Error('Could not decode SponsoredOnboarded event from receipt.')
  }

  const owner = await retry(() =>
    publicClient.readContract({
      address: ERC8004_REGISTRY_ADDRESS as `0x${string}`,
      abi: registryAbi,
      functionName: 'ownerOf',
      args: [agentId],
    })
  )

  const bonded = await publicClient.readContract({
    address: SRP_VAULT_ADDRESS as `0x${string}`,
    abi: vaultAbi,
    functionName: 'isBonded',
    args: [agentId],
  })

  let status = await publicClient.readContract({
    address: ERC8004_REGISTRY_ADDRESS as `0x${string}`,
    abi: registryAbi,
    functionName: 'getMetadata',
    args: [agentId, 'syntrophic.status'],
  })

  if (!status || status === '0x') {
    const syncHash = await walletClient.writeContract({
      address: SRP_REGISTRY_ADAPTER_ADDRESS as `0x${string}`,
      abi: adapterAbi,
      functionName: 'syncBondMetadata',
      args: [agentId],
      account,
      chain: base,
      gasPrice,
    })
    await publicClient.waitForTransactionReceipt({ hash: syncHash })
    status = await retry(() =>
      publicClient.readContract({
        address: ERC8004_REGISTRY_ADDRESS as `0x${string}`,
        abi: registryAbi,
        functionName: 'getMetadata',
        args: [agentId, 'syntrophic.status'],
      })
    )
  }

  const scoreHex = await publicClient.readContract({
    address: ERC8004_REGISTRY_ADDRESS as `0x${string}`,
    abi: registryAbi,
    functionName: 'getMetadata',
    args: [agentId, 'syntrophic.score'],
  })

  const metadataStatus = status && status !== '0x' ? hexToString(status as `0x${string}`) : null
  const metadataScore = scoreHex && scoreHex !== '0x' ? Number(BigInt(scoreHex as `0x${string}`)) : null

  return {
    txHash: hash,
    agentId: Number(agentId),
    owner,
    bonded,
    metadataStatus,
    metadataScore,
  }
}
