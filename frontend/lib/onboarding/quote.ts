import { ONBOARDING_QUOTE_TTL_MS, QUOTE_PRICE_USDC } from './constants'
import { normalizeProfileInput, validateBeneficiaryAddress, validateChainIds } from './profile'
import { createId, saveQuote } from './store'
import type { OnboardingProfileInput, OnboardingQuoteRecord } from './types'

function formatUsd(value: number) {
  return value.toFixed(2)
}

export async function createOnboardingQuote(input: {
  beneficiary: string
  profile: OnboardingProfileInput
  chain_ids?: number[]
}) {
  const beneficiary = validateBeneficiaryAddress(input.beneficiary)
  const chain_ids = validateChainIds(input.chain_ids)
  const profile = normalizeProfileInput(input.profile)

  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + ONBOARDING_QUOTE_TTL_MS)
  const total =
    QUOTE_PRICE_USDC.bond_principal_usdc +
    QUOTE_PRICE_USDC.execution_gas_usdc +
    QUOTE_PRICE_USDC.ipfs_pin_usdc +
    QUOTE_PRICE_USDC.service_fee_usdc

  const quote: OnboardingQuoteRecord = {
    quote_id: createId('quote'),
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    beneficiary,
    chain_ids,
    currency: 'USDC',
    total_usdc: formatUsd(total),
    line_items: {
      bond_principal_usdc: formatUsd(QUOTE_PRICE_USDC.bond_principal_usdc),
      execution_gas_usdc: formatUsd(QUOTE_PRICE_USDC.execution_gas_usdc),
      ipfs_pin_usdc: formatUsd(QUOTE_PRICE_USDC.ipfs_pin_usdc),
      service_fee_usdc: formatUsd(QUOTE_PRICE_USDC.service_fee_usdc),
    },
    profile,
  }

  await saveQuote(quote)
  return quote
}
