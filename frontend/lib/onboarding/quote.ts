import { ONBOARDING_QUOTE_TTL_MS, QUOTE_PRICE_USDC } from './constants'
import { normalizeProfileInput, validateBeneficiaryAddress, validateChainIds } from './profile'
import { createId, saveQuote } from './store'
import type { OnboardingProfileInput, OnboardingQuoteRecord } from './types'

function formatUsd(value: number) {
  return value.toFixed(2)
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
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
    payment_guidance: {
      launch_path: '',
      beneficiary_wallet_role:
        'The beneficiary wallet becomes the final owner of the ERC-8004 identity and bonded agent profile.',
      payer_wallet_role:
        'The payer wallet signs the x402 payment. It may be the same as the beneficiary wallet, but a public beneficiary address alone is not enough to self-pay.',
      self_pay_requires: [
        'a payer wallet with enough USDC for the x402 charge',
        'signing access to that payer wallet, such as a private key or wallet tool',
        'an x402-capable client or helper runtime',
      ],
      helper_command_template: '',
      quote_only_command_template:
        `npm run launch:agent -- --quote-only --handoff-file=./syntrophic-handoff.json --beneficiary=${beneficiary} --name=${shellQuote(profile.name)} --description=${shellQuote(profile.description)} --service=${shellQuote(profile.services[0]?.url ?? 'https://example.com')}`,
      resume_handoff_command_template:
        'X402_PAYER_PRIVATE_KEY=0xYOUR_PAYER_KEY npm run launch:agent -- --resume-handoff=./syntrophic-handoff.json',
    },
  }

  quote.payment_guidance.launch_path = `/api/onboarding/launches/${quote.quote_id}`
  quote.payment_guidance.helper_command_template =
    `X402_PAYER_PRIVATE_KEY=0xYOUR_PAYER_KEY npm run launch:agent -- --quote=${quote.quote_id} --beneficiary=${beneficiary} --app-url=https://syntrophic.md`

  await saveQuote(quote)
  return quote
}
