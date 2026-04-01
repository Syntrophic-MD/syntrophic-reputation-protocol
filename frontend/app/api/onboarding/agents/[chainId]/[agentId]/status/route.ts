import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, hexToString, http, parseAbi } from 'viem'

const registryAbi = parseAbi([
  'function ownerOf(uint256 agentId) view returns (address owner)',
  'function getMetadata(uint256 agentId, string metadataKey) view returns (bytes metadataValue)',
])

const vaultAbi = parseAbi([
  'function isBonded(uint256 agentId) view returns (bool)',
])

const base = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org'] },
    public: { http: ['https://mainnet.base.org'] },
  },
} as const

export async function GET(_req: NextRequest, context: { params: Promise<{ chainId: string; agentId: string }> }) {
  const { chainId, agentId } = await context.params

  if (Number(chainId) !== 8453) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_INPUT',
          message: 'MVP status endpoint currently supports Base only.',
          retryable: false,
        },
      },
      { status: 400 }
    )
  }

  try {
    const client = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org'),
    })
    const registry = (process.env.NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS ??
      '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432') as `0x${string}`
    const vault = (process.env.NEXT_PUBLIC_SRP_VAULT_ADDRESS ??
      '0xFdB160B2B2f2e6189895398563D907fD8239d4e3') as `0x${string}`
    const tokenId = BigInt(agentId)

    const [owner, isBonded, statusHex, scoreHex] = await Promise.all([
      client.readContract({ address: registry, abi: registryAbi, functionName: 'ownerOf', args: [tokenId] }),
      client.readContract({ address: vault, abi: vaultAbi, functionName: 'isBonded', args: [tokenId] }),
      client.readContract({ address: registry, abi: registryAbi, functionName: 'getMetadata', args: [tokenId, 'syntrophic.status'] }),
      client.readContract({ address: registry, abi: registryAbi, functionName: 'getMetadata', args: [tokenId, 'syntrophic.score'] }),
    ])

    return NextResponse.json({
      chain_id: Number(chainId),
      agent_id: Number(agentId),
      owner,
      is_bonded: isBonded,
      metadata: {
        syntrophic_status: statusHex && statusHex !== '0x' ? hexToString(statusHex as `0x${string}`) : null,
        syntrophic_score: scoreHex && scoreHex !== '0x' ? Number(BigInt(scoreHex as `0x${string}`)) : null,
      },
      indexer: {
        visible: null,
        lag_detected: null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: 'EXTERNAL_PROVIDER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch agent status.',
          retryable: true,
        },
      },
      { status: 502 }
    )
  }
}
