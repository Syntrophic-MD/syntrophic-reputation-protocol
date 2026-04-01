import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { OnboardingJobRecord, OnboardingQuoteRecord } from './types'

const ROOT_DIR = path.join(process.cwd(), '.runtime', 'onboarding')
const QUOTES_DIR = path.join(ROOT_DIR, 'quotes')
const JOBS_DIR = path.join(ROOT_DIR, 'jobs')

async function ensureDirs() {
  await fs.mkdir(QUOTES_DIR, { recursive: true })
  await fs.mkdir(JOBS_DIR, { recursive: true })
}

function quotePath(id: string) {
  return path.join(QUOTES_DIR, `${id}.json`)
}

function jobPath(id: string) {
  return path.join(JOBS_DIR, `${id}.json`)
}

export function createId(prefix: 'quote' | 'job') {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`
}

export async function saveQuote(quote: OnboardingQuoteRecord) {
  await ensureDirs()
  await fs.writeFile(quotePath(quote.quote_id), JSON.stringify(quote, null, 2))
}

export async function loadQuote(quoteId: string): Promise<OnboardingQuoteRecord | null> {
  try {
    const raw = await fs.readFile(quotePath(quoteId), 'utf8')
    return JSON.parse(raw) as OnboardingQuoteRecord
  } catch {
    return null
  }
}

export async function saveJob(job: OnboardingJobRecord) {
  await ensureDirs()
  await fs.writeFile(jobPath(job.job_id), JSON.stringify(job, null, 2))
}

export async function loadJob(jobId: string): Promise<OnboardingJobRecord | null> {
  try {
    const raw = await fs.readFile(jobPath(jobId), 'utf8')
    return JSON.parse(raw) as OnboardingJobRecord
  } catch {
    return null
  }
}
