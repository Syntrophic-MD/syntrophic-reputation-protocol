import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function parseArgs() {
  const defaults = {
    existingWalletsFile: path.resolve(
      process.cwd(),
      '..',
      'agent-onboarding-demo',
      '.secrets',
      'wallet-batches',
      'agents_222_227_wallets.json'
    ),
    profilesFile: path.resolve(
      process.cwd(),
      '..',
      'agent-onboarding-demo',
      'profiles',
      'syntrophic_demo_agents_223_232.json'
    ),
    outFile: path.resolve(
      process.cwd(),
      '..',
      'agent-onboarding-demo',
      '.secrets',
      'wallet-batches',
      'demo_agents_223_232_wallets.json'
    ),
    count: 10,
  }

  const args = { ...defaults }
  for (let i = 2; i < process.argv.length; i += 1) {
    const value = process.argv[i]
    const [flag, inline] = value.includes('=') ? value.split('=', 2) : [value, null]
    const next = inline ?? process.argv[++i]
    switch (flag) {
      case '--existing-wallets-file':
        args.existingWalletsFile = path.resolve(next)
        break
      case '--profiles-file':
        args.profilesFile = path.resolve(next)
        break
      case '--out-file':
        args.outFile = path.resolve(next)
        break
      case '--count':
        args.count = Number(next)
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
      default:
        throw new Error(`Unknown argument: ${flag}`)
    }
  }

  if (!Number.isInteger(args.count) || args.count <= 0) {
    throw new Error('--count must be a positive integer.')
  }

  return args
}

function printUsage() {
  console.log(`Usage:
  npm run demo:judge-prepare -- [options]

Options:
  --existing-wallets-file <path>   Existing wallet batch JSON
  --profiles-file <path>           Combined judge profile JSON
  --out-file <path>                Output combined beneficiary wallet JSON
  --count <n>                      Total number of entries to prepare`)
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function generateWallets(count) {
  const { stdout } = await execFileAsync('cast', ['wallet', 'new', '--number', String(count), '--json'])
  return JSON.parse(stdout)
}

async function main() {
  const args = parseArgs()
  const profiles = await readJson(args.profilesFile)
  const existing = await readJson(args.existingWalletsFile)

  const existingBeneficiaries = existing.filter((item) => item.agent_id !== 32055)
  const needed = Math.max(0, args.count - existingBeneficiaries.length)

  let generated = []
  if (needed > 0) {
    generated = await generateWallets(needed)
  }

  const newEntries = generated.map((wallet, index) => {
    const profile = profiles[existingBeneficiaries.length + index]
    return {
      address: wallet.address,
      private_key: wallet.private_key,
      name: profile?.name ?? `Syntrophic Demo Agent ${existingBeneficiaries.length + index + 1}`,
      planned_profile_number: profile?.number ?? null,
    }
  })

  const combined = [...existingBeneficiaries, ...newEntries].slice(0, args.count)
  await fs.mkdir(path.dirname(args.outFile), { recursive: true })
  await fs.writeFile(args.outFile, JSON.stringify(combined, null, 2))

  console.log(`Prepared ${combined.length} beneficiary wallets.`)
  console.log(`Existing reused: ${existingBeneficiaries.length}`)
  console.log(`New generated: ${newEntries.length}`)
  console.log(`Output: ${args.outFile}`)
  for (const item of combined) {
    console.log(`${item.name} -> ${item.address}${item.agent_id ? ` (existing ${item.agent_id})` : ''}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
