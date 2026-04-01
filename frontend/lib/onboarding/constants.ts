export const BASE_CHAIN_ID = 8453 as const
export const ERC8004_REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_ERC8004_REGISTRY_ADDRESS ??
  '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
export const SRP_VAULT_ADDRESS =
  process.env.NEXT_PUBLIC_SRP_VAULT_ADDRESS ??
  '0xFdB160B2B2f2e6189895398563D907fD8239d4e3'
export const SRP_REGISTRY_ADAPTER_ADDRESS =
  process.env.NEXT_PUBLIC_SRP_REGISTRY_ADAPTER_ADDRESS ??
  '0x2ADF396943421a70088d74A8281852344606D668'

export const ONBOARDING_QUOTE_TTL_MS = 15 * 60 * 1000

export const QUOTE_PRICE_USDC = {
  bond_principal_usdc: 0.03,
  execution_gas_usdc: 0.04,
  ipfs_pin_usdc: 0.01,
  service_fee_usdc: 0.02,
} as const

export function getTotalQuotePriceUsd() {
  return (
    QUOTE_PRICE_USDC.bond_principal_usdc +
    QUOTE_PRICE_USDC.execution_gas_usdc +
    QUOTE_PRICE_USDC.ipfs_pin_usdc +
    QUOTE_PRICE_USDC.service_fee_usdc
  )
}

export function getTotalQuotePriceUsdString() {
  return `$${getTotalQuotePriceUsd().toFixed(2)}`
}
