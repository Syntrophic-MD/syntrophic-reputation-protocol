export type SupportedChainId = 8453

export interface OnboardingServiceInput {
  type: 'mcp' | 'a2a' | 'web' | 'oasf'
  url: string
}

export interface OnboardingProfileInput {
  name: string
  description: string
  image_url?: string
  services: OnboardingServiceInput[]
}

export interface NormalizedOnboardingProfile {
  name: string
  description: string
  image: string | null
  services: Array<{
    name: string
    endpoint: string
    type: string
    url: string
  }>
  supportedTrust: ['reputation', 'crypto-economic']
  x402support: true
  active: true
}

export interface OnboardingQuoteLineItems {
  bond_principal_usdc: string
  execution_gas_usdc: string
  ipfs_pin_usdc: string
  service_fee_usdc: string
}

export interface OnboardingPaymentGuidance {
  launch_path: string
  beneficiary_wallet_role: string
  payer_wallet_role: string
  self_pay_requires: string[]
  helper_command_template: string
  quote_only_command_template: string
  resume_handoff_command_template: string
}

export interface OnboardingQuoteRecord {
  quote_id: string
  created_at: string
  expires_at: string
  beneficiary: `0x${string}`
  chain_ids: SupportedChainId[]
  currency: 'USDC'
  total_usdc: string
  line_items: OnboardingQuoteLineItems
  profile: NormalizedOnboardingProfile
  payment_guidance: OnboardingPaymentGuidance
}

export interface OnboardingChainResult {
  chain_id: number
  registry_address: string
  vault_address: string
  agent_id: number
  agent_uri: string
  owner: string
  bonded: boolean
  tx_hash: string
  metadata_status: string | null
  metadata_score: number | null
}

export interface OnboardingProofBundle {
  quote_id: string
  job_id: string
  payment_ref: string
  beneficiary: string
  verification_name: string
  verification_url: string
  verification_line: string
  badge_markdown: string
  chain_results: OnboardingChainResult[]
}

export interface OnboardingJobRecord {
  job_id: string
  operation_id: 'onboarding.launch_sponsored'
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  created_at: string
  started_at: string | null
  completed_at: string | null
  quote_id: string
  beneficiary: `0x${string}`
  chain_ids: SupportedChainId[]
  payment_ref: string
  result: {
    proof_bundle: OnboardingProofBundle
  } | null
  error: {
    code: string
    message: string
    retryable: boolean
    details?: Record<string, unknown>
  } | null
}
