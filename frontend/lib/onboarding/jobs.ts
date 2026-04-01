import { ERC8004_REGISTRY_ADDRESS, SRP_VAULT_ADDRESS } from './constants'
import { executeSponsoredOnboarding } from './chain'
import { createPaymentRef, buildRegistrationFile, validateBeneficiaryAddress, validateChainIds } from './profile'
import { loadQuote, saveJob, loadJob, createId } from './store'
import { pinRegistrationFile } from './pinata'
import type { OnboardingJobRecord, OnboardingProofBundle, OnboardingQuoteRecord } from './types'

function quoteExpired(quote: OnboardingQuoteRecord) {
  return new Date(quote.expires_at).getTime() < Date.now()
}

function errorRecord(code: string, message: string, retryable = false, details?: Record<string, unknown>) {
  return { code, message, retryable, details }
}

export function loadLaunchQuoteOrThrow(input: {
  quoteId: string
  beneficiary: string
  chainIds?: number[]
}) {
  return loadAndValidateQuote(input)
}

async function loadAndValidateQuote(input: {
  quoteId: string
  beneficiary: string
  chainIds?: number[]
}) {
  const quote = await loadQuote(input.quoteId)
  if (!quote) {
    throw Object.assign(new Error('Quote not found.'), { code: 'INVALID_INPUT', status: 404 })
  }

  if (quoteExpired(quote)) {
    throw Object.assign(new Error('Quote has expired.'), { code: 'QUOTE_EXPIRED', status: 410 })
  }

  const beneficiary = validateBeneficiaryAddress(input.beneficiary)
  const chain_ids = validateChainIds(input.chainIds)

  if (quote.beneficiary.toLowerCase() !== beneficiary.toLowerCase()) {
    throw Object.assign(new Error('Beneficiary does not match the original quote.'), {
      code: 'INVALID_INPUT',
      status: 400,
    })
  }

  return { quote, beneficiary, chain_ids }
}

async function performLaunch(job: OnboardingJobRecord, quote: OnboardingQuoteRecord): Promise<OnboardingProofBundle> {
  const registrationFile = buildRegistrationFile(quote.profile, job.beneficiary)
  const { uri } = await pinRegistrationFile(registrationFile)
  const chainResult = await executeSponsoredOnboarding({
    beneficiary: job.beneficiary,
    agentUri: uri,
    paymentRef: job.payment_ref as `0x${string}`,
  })

  return {
    quote_id: quote.quote_id,
    job_id: job.job_id,
    payment_ref: job.payment_ref,
    beneficiary: job.beneficiary,
    chain_results: [
      {
        chain_id: 8453,
        registry_address: ERC8004_REGISTRY_ADDRESS,
        vault_address: SRP_VAULT_ADDRESS,
        agent_id: chainResult.agentId,
        agent_uri: uri,
        owner: chainResult.owner,
        bonded: chainResult.bonded,
        tx_hash: chainResult.txHash,
        metadata_status: chainResult.metadataStatus,
        metadata_score: chainResult.metadataScore,
      },
    ],
  }
}

function buildJob(input: {
  quote: OnboardingQuoteRecord
  beneficiary: `0x${string}`
  chain_ids: number[]
  paymentRef: string
}): OnboardingJobRecord {
  return {
    job_id: createId('job'),
    operation_id: 'onboarding.launch_sponsored',
    status: 'queued',
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    quote_id: input.quote.quote_id,
    beneficiary: input.beneficiary,
    chain_ids: input.chain_ids as OnboardingJobRecord['chain_ids'],
    payment_ref: input.paymentRef,
    result: null,
    error: null,
  }
}

export async function executeLaunchDirect(input: {
  quoteId: string
  beneficiary: string
  chainIds?: number[]
}): Promise<OnboardingJobRecord> {
  const { quote, beneficiary, chain_ids } = await loadAndValidateQuote(input)
  const paymentRef = createPaymentRef(quote.quote_id, beneficiary)
  const job = buildJob({ quote, beneficiary, chain_ids, paymentRef })

  job.status = 'running'
  job.started_at = new Date().toISOString()
  await saveJob(job)

  try {
    const proofBundle = await performLaunch(job, quote)
    job.status = 'succeeded'
    job.completed_at = new Date().toISOString()
    job.result = { proof_bundle: proofBundle }
    job.error = null
    await saveJob(job)
    return job
  } catch (error) {
    job.status = 'failed'
    job.completed_at = new Date().toISOString()
    job.result = null
    job.error = errorRecord(
      'ONCHAIN_REVERT',
      error instanceof Error ? error.message : 'Sponsored onboarding failed.',
      true
    )
    await saveJob(job)
    throw error
  }
}

export async function createLaunchJob(input: {
  quoteId: string
  beneficiary: string
  chainIds?: number[]
  paymentAcknowledged?: boolean
}) {
  const { quote, beneficiary, chain_ids } = await loadAndValidateQuote(input)

  if (!input.paymentAcknowledged) {
    const paymentError = {
      code: 'PAYMENT_REQUIRED',
      message: 'This launch requires x402 payment before sponsored execution can start.',
      retryable: true,
      details: {
        quote_id: quote.quote_id,
        total_usdc: quote.total_usdc,
        currency: quote.currency,
      },
    }

    throw Object.assign(new Error(paymentError.message), {
      code: paymentError.code,
      status: 402,
      details: paymentError.details,
    })
  }

  const paymentRef = createPaymentRef(quote.quote_id, beneficiary)
  const job = buildJob({ quote, beneficiary, chain_ids, paymentRef })

  await saveJob(job)
  void runLaunchJob(job.job_id)
  return job
}

export async function runLaunchJob(jobId: string) {
  const job = await loadJob(jobId)
  if (!job || job.status !== 'queued') return

  job.status = 'running'
  job.started_at = new Date().toISOString()
  await saveJob(job)

  try {
    const quote = await loadQuote(job.quote_id)
    if (!quote) {
      throw new Error('Launch quote disappeared before execution.')
    }
    const proofBundle = await performLaunch(job, quote)

    job.status = 'succeeded'
    job.completed_at = new Date().toISOString()
    job.result = { proof_bundle: proofBundle }
    job.error = null
    await saveJob(job)
  } catch (error) {
    job.status = 'failed'
    job.completed_at = new Date().toISOString()
    job.result = null
    job.error = errorRecord(
      'ONCHAIN_REVERT',
      error instanceof Error ? error.message : 'Sponsored onboarding failed.',
      true
    )
    await saveJob(job)
  }
}
