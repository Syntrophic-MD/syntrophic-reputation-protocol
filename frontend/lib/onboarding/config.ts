import { BASE_CHAIN_ID, ERC8004_REGISTRY_ADDRESS, SRP_VAULT_ADDRESS } from './constants'
import { privateKeyToAccount } from 'viem/accounts'

export interface OnboardingRuntimeConfig {
  baseRpcUrl: string
  sponsorPrivateKey: `0x${string}` | null
  sponsoredOnboarderAddress: `0x${string}` | null
  pinataJwt: string | null
  pinataGatewayBase: string
  x402PayToAddress: `0x${string}` | null
  x402FacilitatorUrl: string
  chainId: typeof BASE_CHAIN_ID
  registryAddress: string
  vaultAddress: string
}

export function getOnboardingConfig(): OnboardingRuntimeConfig {
  const sponsorPrivateKey =
    (process.env.SPONSORED_ONBOARDER_PRIVATE_KEY as `0x${string}` | undefined) ??
    (process.env.PRIVATE_KEY as `0x${string}` | undefined) ??
    null
  const derivedPayToAddress = sponsorPrivateKey ? privateKeyToAccount(sponsorPrivateKey).address : null

  return {
    baseRpcUrl: process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'https://mainnet.base.org',
    sponsorPrivateKey,
    sponsoredOnboarderAddress:
      (process.env.SPONSORED_ONBOARDER_ADDRESS as `0x${string}` | undefined) ??
      null,
    pinataJwt: process.env.PINATA_JWT ?? null,
    pinataGatewayBase: process.env.PINATA_GATEWAY_BASE ?? 'https://gateway.pinata.cloud/ipfs/',
    x402PayToAddress:
      (process.env.X402_PAY_TO_ADDRESS as `0x${string}` | undefined) ??
      derivedPayToAddress,
    x402FacilitatorUrl: process.env.X402_FACILITATOR_URL ?? 'https://facilitator.x402.org',
    chainId: BASE_CHAIN_ID,
    registryAddress: ERC8004_REGISTRY_ADDRESS,
    vaultAddress: SRP_VAULT_ADDRESS,
  }
}

export function assertLaunchConfig() {
  const config = getOnboardingConfig()
  const missing: string[] = []

  if (!config.baseRpcUrl) missing.push('BASE_RPC_URL')
  if (!config.sponsorPrivateKey) missing.push('SPONSORED_ONBOARDER_PRIVATE_KEY')
  if (!config.sponsoredOnboarderAddress) missing.push('SPONSORED_ONBOARDER_ADDRESS')
  if (!config.pinataJwt) missing.push('PINATA_JWT')

  if (missing.length > 0) {
    throw new Error(`Missing required onboarding configuration: ${missing.join(', ')}`)
  }

  return config
}

export function assertX402Config() {
  const config = getOnboardingConfig()
  const missing: string[] = []

  if (!config.x402PayToAddress) missing.push('X402_PAY_TO_ADDRESS or SPONSORED_ONBOARDER_PRIVATE_KEY')
  if (!config.x402FacilitatorUrl) missing.push('X402_FACILITATOR_URL')

  if (missing.length > 0) {
    throw new Error(`Missing required x402 configuration: ${missing.join(', ')}`)
  }

  return config
}
