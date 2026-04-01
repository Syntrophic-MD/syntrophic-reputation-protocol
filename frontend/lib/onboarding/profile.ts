import crypto from 'node:crypto'

import type {
  NormalizedOnboardingProfile,
  OnboardingProfileInput,
  OnboardingServiceInput,
  SupportedChainId,
} from './types'
import { BASE_CHAIN_ID } from './constants'

function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Service URLs must use http or https.')
    }
    return parsed.toString()
  } catch {
    throw new Error(`Invalid URL: ${url}`)
  }
}

function normalizeService(service: OnboardingServiceInput) {
  return {
    type: service.type,
    url: normalizeUrl(service.url),
  }
}

export function validateBeneficiaryAddress(value: string): `0x${string}` {
  if (!isAddress(value)) {
    throw new Error('Beneficiary must be a valid EVM address.')
  }
  return value
}

export function validateChainIds(chainIds: number[] | undefined): SupportedChainId[] {
  if (!chainIds || chainIds.length === 0) {
    return [BASE_CHAIN_ID]
  }

  if (chainIds.length !== 1 || chainIds[0] !== BASE_CHAIN_ID) {
    throw new Error('MVP currently supports Base only. Future releases will support user-selected multi-chain launches.')
  }

  return [BASE_CHAIN_ID]
}

export function normalizeProfileInput(profile: OnboardingProfileInput): NormalizedOnboardingProfile {
  const name = profile.name.trim()
  const description = profile.description.trim()

  if (name.length < 3) {
    throw new Error('Agent name must be at least 3 characters.')
  }

  if (description.length < 20) {
    throw new Error('Description must be at least 20 characters.')
  }

  if (!Array.isArray(profile.services) || profile.services.length === 0) {
    throw new Error('At least one service endpoint is required.')
  }

  const services = profile.services.map(normalizeService)
  const image = profile.image_url?.trim() ? normalizeUrl(profile.image_url.trim()) : null

  return {
    name,
    description,
    image,
    services,
    supportedTrust: ['reputation', 'crypto-economic'],
    x402support: true,
    active: true,
  }
}

export function buildRegistrationFile(profile: NormalizedOnboardingProfile, beneficiary: `0x${string}`) {
  const now = new Date().toISOString()

  return {
    name: profile.name,
    description: profile.description,
    image: profile.image,
    owners: [beneficiary],
    operators: [beneficiary],
    active: profile.active,
    x402support: profile.x402support,
    supportedTrust: profile.supportedTrust,
    services: profile.services,
    metadata: {
      'syntrophic.onboarding': 'sponsored-x402-mvp',
      'syntrophic.launchMode': 'base-sponsored',
    },
    updatedAt: now,
  }
}

export function createPaymentRef(quoteId: string, beneficiary: string) {
  return `0x${crypto.createHash('sha256').update(`${quoteId}:${beneficiary}`).digest('hex')}`
}
