import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatEth(wei: bigint | number, decimals = 4): string {
  const eth = typeof wei === 'bigint' ? Number(wei) / 1e18 : wei / 1e18
  return eth.toFixed(decimals)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getRepLevel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'Elite', color: '#00c853' }
  if (score >= 75) return { label: 'Trusted', color: '#00d4ff' }
  if (score >= 50) return { label: 'Bonded', color: '#0070f3' }
  if (score >= 25) return { label: 'Active', color: '#ffa000' }
  return { label: 'New', color: 'rgba(232,238,248,0.4)' }
}

// Deterministic mock data generator
export function seedRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

export interface Agent {
  id: string
  name: string
  address: string
  operator: string
  stakeAmount: number
  reputationScore: number
  isVerified: boolean
  isStaked: boolean
  registeredAt: string
  lastActive: string
  description: string
  capabilities: string[]
  attestationCount: number
  slashCount: number
  networkId: number
  reviewCount: number
}

const agentNames = [
  'AlphaBot', 'NeuralLink', 'Axiom Prime', 'Cipher Node', 'DataFlow',
  'Echo Agent', 'Flux AI', 'GridMind', 'Helix Core', 'Iris Protocol',
  'Janus System', 'Karma Net', 'Lambda AI', 'Mosaic Node', 'Nexus Agent',
  'Oracle Prime', 'Photon AI', 'Quantum Hub', 'Relay Node', 'Sigma Bot',
]

const capabilities = [
  'NLP', 'Vision', 'Code Gen', 'Data Analysis', 'Smart Contracts',
  'DeFi', 'Trading', 'Monitoring', 'Orchestration', 'Verification',
]

export function generateMockAgents(count = 20): Agent[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = seedRandom(i * 12345)
    const address = `0x${Array.from({ length: 40 }, () =>
      Math.floor(rng() * 16).toString(16)
    ).join('')}`
    const operator = `0x${Array.from({ length: 40 }, () =>
      Math.floor(rng() * 16).toString(16)
    ).join('')}`
    const score = Math.floor(rng() * 100)
    const staked = rng() > 0.3
    const caps = capabilities.filter(() => rng() > 0.6).slice(0, 3)

    return {
      id: `agent-${i}`,
      name: agentNames[i % agentNames.length],
      address,
      operator,
      stakeAmount: staked ? parseFloat((rng() * 2).toFixed(4)) : 0,
      reputationScore: score,
      isVerified: score > 50 && staked,
      isStaked: staked,
      registeredAt: new Date(Date.now() - rng() * 90 * 86400000).toISOString(),
      lastActive: new Date(Date.now() - rng() * 7 * 86400000).toISOString(),
      description: `Advanced ERC-8004 agent with on-chain reputation staking. Specialized in ${caps[0] || 'general purpose'} operations on Base network.`,
      capabilities: caps.length > 0 ? caps : ['General'],
      attestationCount: Math.floor(rng() * 50),
      slashCount: Math.floor(rng() * 3),
      networkId: 84532,
      reviewCount: Math.floor(rng() * 100),
    }
  })
}
