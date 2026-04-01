'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { ArrowRight, CheckCircle2, CircleDashed, Coins, Copy, Download, Rocket, ShieldCheck } from 'lucide-react'

import { Footer } from '@/components/footer'
import { Navbar } from '@/components/navbar'
import { GlassCard } from '@/components/ui'
import { truncateAddress } from '@/lib/utils'

interface QuoteResponse {
  quote_id: string
  expires_at: string
  currency: 'USDC'
  total_usdc: string
  line_items: {
    bond_principal_usdc: string
    execution_gas_usdc: string
    ipfs_pin_usdc: string
    service_fee_usdc: string
  }
}

interface JobResponse {
  job_id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  result: null | {
    proof_bundle: {
      quote_id: string
      job_id: string
      payment_ref: string
      beneficiary: string
      verification_name: string
      verification_url: string
      verification_line: string
      badge_markdown: string
      chain_results: Array<{
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
      }>
    }
  }
  error: null | {
    code: string
    message: string
    retryable: boolean
  }
}

const initialForm = {
  beneficiary: '',
  name: '',
  description: '',
  serviceUrl: '',
  imageUrl: '',
}

type FormState = typeof initialForm
type FormErrors = Partial<Record<keyof FormState, string>>

function looksLikeAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function looksLikeHttpUrl(value: string) {
  try {
    const normalized = normalizeHttpUrl(value)
    if (!normalized) return false
    const parsed = new URL(normalized)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!looksLikeAddress(form.beneficiary)) {
    errors.beneficiary = 'Enter a valid EVM wallet address.'
  }

  if (form.name.trim().length < 3) {
    errors.name = 'Agent name must be at least 3 characters.'
  }

  if (form.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.'
  }

  if (!looksLikeHttpUrl(form.serviceUrl)) {
    errors.serviceUrl = 'Enter a valid http or https URL.'
  }

  if (form.imageUrl.trim() && !looksLikeHttpUrl(form.imageUrl)) {
    errors.imageUrl = 'Image URL must be a valid http or https URL.'
  }

  return errors
}

async function readJsonSafe(response: Response) {
  const text = await response.text()
  try {
    return { data: JSON.parse(text), raw: text }
  } catch {
    return { data: null, raw: text }
  }
}

export default function OnboardPage() {
  const [form, setForm] = useState(initialForm)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [job, setJob] = useState<JobResponse | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const [isQuoting, startQuoteTransition] = useTransition()
  const [isLaunching, startLaunchTransition] = useTransition()

  useEffect(() => {
    if (!jobId) return

    let cancelled = false
    const poll = async () => {
      const response = await fetch(`/api/jobs/${jobId}`)
      const { data } = await readJsonSafe(response)
      if (cancelled) return
      if (response.ok) {
        setJob(data)
        if (data.status === 'queued' || data.status === 'running') {
          setTimeout(poll, 1500)
        }
      } else {
        setError(data?.error?.message ?? 'Failed to load onboarding job status.')
      }
    }

    void poll()

    return () => {
      cancelled = true
    }
  }, [jobId])

  const proof = job?.result?.proof_bundle ?? null
  const chainResult = proof?.chain_results?.[0] ?? null
  const helperCommand = quote
    ? `X402_PAYER_PRIVATE_KEY=0xYOUR_PAYER_KEY npm run launch:agent -- --quote=${quote.quote_id} --beneficiary=${form.beneficiary.trim()} --app-url=https://syntrophic.md`
    : null
  const handoffPackage = quote
    ? {
        mode: 'payment-handoff',
        quote_id: quote.quote_id,
        beneficiary: form.beneficiary.trim(),
        app_url: 'https://syntrophic.md',
        rpc_url: 'https://mainnet.base.org',
        profile: {
          name: form.name.trim(),
          description: form.description.trim(),
          image_url: form.imageUrl.trim() ? normalizeHttpUrl(form.imageUrl) : undefined,
          services: [{ type: 'mcp', url: normalizeHttpUrl(form.serviceUrl) }],
        },
      }
    : null

  const quoteLines = useMemo(() => {
    if (!quote) return []
    return [
      ['Bond principal', quote.line_items.bond_principal_usdc],
      ['Execution gas', quote.line_items.execution_gas_usdc],
      ['IPFS pin', quote.line_items.ipfs_pin_usdc],
      ['Service fee', quote.line_items.service_fee_usdc],
    ] as const
  }, [quote])

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleBlur = (field: keyof typeof initialForm) => {
    if (field !== 'serviceUrl' && field !== 'imageUrl') return
    const currentValue = form[field].trim()
    if (!currentValue) return
    handleChange(field, normalizeHttpUrl(currentValue))
  }

  const copyText = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedItem(key)
    setTimeout(() => setCopiedItem((current) => (current === key ? null : current)), 2000)
  }

  const downloadHandoffPackage = () => {
    if (!handoffPackage) return
    const blob = new Blob([JSON.stringify(handoffPackage, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `syntrophic-handoff-${quote?.quote_id ?? 'quote'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleCreateQuote = () => {
    const normalizedForm = {
      ...form,
      beneficiary: form.beneficiary.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      serviceUrl: normalizeHttpUrl(form.serviceUrl),
      imageUrl: form.imageUrl.trim() ? normalizeHttpUrl(form.imageUrl) : '',
    }
    const validationErrors = validateForm(normalizedForm)
    setFieldErrors(validationErrors)
    setForm(normalizedForm)

    if (Object.keys(validationErrors).length > 0) {
      setError('Please fix the highlighted fields before creating a quote.')
      return
    }

    setError(null)
    setQuote(null)
    setJob(null)
    setJobId(null)

    startQuoteTransition(async () => {
      const response = await fetch('/api/onboarding/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: {
            beneficiary: normalizedForm.beneficiary,
            profile: {
              name: normalizedForm.name,
              description: normalizedForm.description,
              image_url: normalizedForm.imageUrl || undefined,
              services: [
                {
                  type: 'mcp',
                  url: normalizedForm.serviceUrl,
                },
              ],
            },
          },
          context: {
            chain_ids: [8453],
          },
        }),
      })

      const { data, raw } = await readJsonSafe(response)
      if (!response.ok) {
        setError(data?.error?.message ?? raw ?? 'Failed to create onboarding quote.')
        return
      }

      setQuote(data)
    })
  }

  const handleLaunch = () => {
    if (!quote) return
    setError(null)
    setJob(null)
    setJobId(null)

    startLaunchTransition(async () => {
      const response = await fetch(`/api/onboarding/launches/${quote.quote_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: {
            beneficiary: form.beneficiary.trim(),
          },
          context: {
            chain_ids: [8453],
          },
        }),
      })

      const { data, raw } = await readJsonSafe(response)
      if (response.status === 402) {
        setError(
          'This browser can create the quote, but the paid launch needs an x402-capable agent or helper. Copy the helper command below or download the handoff package to finish the demo.'
        )
        return
      }
      if (!response.ok) {
        setError(data?.error?.message ?? raw ?? 'Failed to launch sponsored onboarding.')
        return
      }

      setJob({
        job_id: data.job_id,
        status: data.status,
        result: data.proof_bundle ? { proof_bundle: data.proof_bundle } : null,
        error: null,
      })
      setJobId(data.job_id)
    })
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="relative z-10 px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
            <GlassCard elevated className="p-8 md:p-10 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(0,112,243,0.12)', border: '1px solid rgba(0,112,243,0.24)' }}
                >
                  <Rocket size={18} style={{ color: 'var(--accent)' }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                  x402 Demo
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
                Demo sponsored onboarding for a <span className="gradient-text-blue">verified agent badge</span>
              </h1>

              <p className="text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--muted-foreground)' }}>
                This page is the operator-friendly demo surface for Syntrophic onboarding. It prepares an ERC-8004
                registration, prices the x402 payment, and hands the flow off to an x402-capable agent or helper that
                finishes the sponsored Base launch.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins size={16} style={{ color: '#00d4ff' }} />
                    <span className="text-sm font-semibold">One quote</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    The quote covers the bond principal, gas, IPFS, and service fee.
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} style={{ color: 'var(--verified)' }} />
                    <span className="text-sm font-semibold">User-owned identity</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    The ERC-8004 NFT and bonded identity end up owned by the beneficiary wallet.
                  </p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight size={16} style={{ color: '#ffa000' }} />
                    <span className="text-sm font-semibold">Future scope</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Multi-chain launch bundles and sponsored bonding for existing agents are planned next.
                  </p>
                </GlassCard>
              </div>
            </GlassCard>

            <GlassCard className="p-6 md:p-7 flex flex-col gap-5">
              <h2 className="text-xl font-semibold">What ships in this MVP</h2>
              <div className="flex flex-col gap-3">
                {[
                  'Base-only sponsored onboarding for new agents',
                  'One quote and one launch job',
                  'Proof bundle with tx hash, agent ID, and bond state',
                  'Deferred: existing-agent sponsored bond flow',
                  'Deferred: user-selected multi-chain launch bundles',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-6 items-start">
            <GlassCard className="p-7 md:p-8 flex flex-col gap-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                  Demo Intake
                </span>
                <h2 className="text-2xl font-semibold mt-2">Prepare the agent profile and create a quote</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Beneficiary wallet</span>
                  <input
                    value={form.beneficiary}
                    onChange={(event) => handleChange('beneficiary', event.target.value)}
                    placeholder="0x..."
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/20"
                  />
                  {fieldErrors.beneficiary ? (
                    <span className="text-xs text-rose-300">{fieldErrors.beneficiary}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Primary service URL</span>
                  <input
                    value={form.serviceUrl}
                    onChange={(event) => handleChange('serviceUrl', event.target.value)}
                    onBlur={() => handleBlur('serviceUrl')}
                    placeholder="https://agent.example.com/mcp"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/20"
                  />
                  {fieldErrors.serviceUrl ? (
                    <span className="text-xs text-rose-300">{fieldErrors.serviceUrl}</span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      If you paste `example.com`, we will normalize it to `https://example.com`.
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Agent name</span>
                  <input
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder="Scout"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/20"
                  />
                  {fieldErrors.name ? (
                    <span className="text-xs text-rose-300">{fieldErrors.name}</span>
                  ) : null}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    placeholder="Monitors DeFi prices, alerts on anomalies, and serves agent-readable market context."
                    rows={5}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/20"
                  />
                  {fieldErrors.description ? (
                    <span className="text-xs text-rose-300">{fieldErrors.description}</span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Keep it descriptive enough that another app could trust what this agent does.
                    </span>
                  )}
                </label>

                <label className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium">Optional image URL</span>
                  <input
                    value={form.imageUrl}
                    onChange={(event) => handleChange('imageUrl', event.target.value)}
                    onBlur={() => handleBlur('imageUrl')}
                    placeholder="https://example.com/logo.png"
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/20"
                  />
                  {fieldErrors.imageUrl ? (
                    <span className="text-xs text-rose-300">{fieldErrors.imageUrl}</span>
                  ) : null}
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleCreateQuote} className="btn-primary text-sm" disabled={isQuoting}>
                  {isQuoting ? 'Creating quote...' : 'Create quote'}
                </button>
                <Link href="/explore" className="btn-ghost text-sm inline-flex items-center justify-center gap-2">
                  Explore existing agents <ArrowRight size={14} />
                </Link>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}
            </GlassCard>

            <div className="flex flex-col gap-6">
              <GlassCard className="p-7 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Coins size={16} style={{ color: '#00d4ff' }} />
                  <h2 className="text-xl font-semibold">Quote and next step</h2>
                </div>

                {quote ? (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
                        Total
                      </p>
                      <p className="text-3xl font-bold">{quote.total_usdc} {quote.currency}</p>
                      <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        Quote ID: {quote.quote_id}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {quoteLines.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between text-sm">
                          <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                          <span>{value} USDC</span>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
                      Browsers usually cannot satisfy the x402 payment challenge directly. Use the helper command or
                      download the handoff package, then finish the paid launch from an x402-capable runtime.
                    </div>

                    <div className="flex flex-col gap-3">
                      {helperCommand ? (
                        <button
                          type="button"
                          onClick={() => copyText(helperCommand, 'helper')}
                          className="btn-primary text-sm inline-flex items-center justify-center gap-2"
                        >
                          <Copy size={14} />
                          {copiedItem === 'helper' ? 'Copied helper command' : 'Copy helper command'}
                        </button>
                      ) : null}

                      {handoffPackage ? (
                        <button
                          type="button"
                          onClick={downloadHandoffPackage}
                          className="btn-ghost text-sm inline-flex items-center justify-center gap-2"
                        >
                          <Download size={14} />
                          Download handoff JSON
                        </button>
                      ) : null}

                      <button onClick={handleLaunch} className="btn-ghost text-sm" disabled={isLaunching}>
                        {isLaunching ? 'Testing paid launch...' : 'Test the paid launch endpoint anyway'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    Create a quote to see the Base package, helper command, and handoff artifact for the x402 demo.
                  </p>
                )}
              </GlassCard>

              <GlassCard className="p-7 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <CircleDashed size={16} style={{ color: '#ffa000' }} />
                  <h2 className="text-xl font-semibold">Launch status</h2>
                </div>

                {job ? (
                  <>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>
                        Job
                      </p>
                      <p className="font-mono text-sm">{job.job_id}</p>
                      <p className="mt-3 text-sm">
                        Status:{' '}
                        <span className="font-semibold">
                          {job.status}
                        </span>
                      </p>
                    </div>

                    {job.error ? (
                      <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {job.error.message}
                      </div>
                    ) : null}

                    {proof && chainResult ? (
                      <div className="flex flex-col gap-3">
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                          Sponsored launch complete. Your proof bundle is ready.
                        </div>
                        <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-4 text-sm">
                          <p className="font-semibold text-sky-100">Verification line</p>
                          <p className="mt-2 break-all text-sky-50">{proof.verification_line}</p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <a
                              href={proof.verification_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-ghost text-sm inline-flex items-center justify-center gap-2"
                            >
                              Open verification page <ArrowRight size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(proof.verification_line)}
                              className="btn-ghost text-sm"
                            >
                              Copy verification line
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Chain</span>
                            <span>Base ({chainResult.chain_id})</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Agent ID</span>
                            <span>{chainResult.agent_id}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Owner</span>
                            <span>{truncateAddress(chainResult.owner)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Bonded</span>
                            <span>{chainResult.bonded ? 'true' : 'false'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Metadata status</span>
                            <span>{chainResult.metadata_status ?? 'pending'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span style={{ color: 'var(--muted-foreground)' }}>Metadata score</span>
                            <span>{chainResult.metadata_score ?? 'pending'}</span>
                          </div>
                        </div>
                        <a
                          href={`https://basescan.org/tx/${chainResult.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-ghost text-sm inline-flex items-center justify-center gap-2"
                        >
                          View transaction on BaseScan <ArrowRight size={14} />
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Once the job is running, this panel will update automatically until the proof bundle is ready.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No launch job yet. Create a quote first, then start the sponsored onboarding flow.
                  </p>
                )}
              </GlassCard>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
