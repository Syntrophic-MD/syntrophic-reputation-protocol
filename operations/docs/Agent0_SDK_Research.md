# Agent0 SDK — Research Findings

**Date:** 2026-03-29
**Source:** https://sdk.ag0.xyz/docs, https://github.com/agent0lab/agent0-ts
**Version studied:** 1.7.1 (published March 16, 2026)
**License:** MIT
**npm package:** `agent0-sdk`

---

## 1. What Is Agent0?

Agent0 is **"the SDK for agentic economies"** — a TypeScript and Python library that enables AI agents to register on-chain identity, advertise capabilities, build reputation, and discover one another using ERC-8004 and IPFS/Filecoin, without relying on proprietary catalogues or centralized intermediaries.

**The core problem it solves:** Existing agent protocols (MCP, A2A) handle communication but provide no standard for discovery and trust across organizational boundaries. Agent0 implements ERC-8004 to create permissionless, cryptographically-verifiable agent identity, discovery, and reputation on Ethereum-compatible chains.

**Attribution:** Created by Marco De Rossi in collaboration with Consensys, MetaMask, Agent0 Inc., Edge & Node, Protocol Labs, and Pinata. MIT public good.

**Key differentiator from other SDKs:** Agent0 is focused exclusively on *identity, discovery, and reputation* — not orchestration or reasoning. It is the reference implementation of ERC-8004.

---

## 2. Installation

```bash
# TypeScript
npm install agent0-sdk       # Node.js 22.0.0+ required

# Python
pip install agent0-sdk       # Python 3.8+ required
```

**Core dependencies:** `viem ^2.37.5`, `helia ^5.0.0`, `undici ^6.23.0`, `multiformats ^13.0.0`, `graphql-request ^6.1.0`

---

## 3. SDK Initialization Modes

Three signing modes — the most important for Syntrophic's use case is the browser wallet mode:

```typescript
// Mode 1: Browser wallet (EIP-6963 / MetaMask / Coinbase Wallet)
// → User signs transactions in their own wallet. Syntrophic never sees the key.
const sdk = new SDK({
  chainId: 8453,
  walletProvider: window.ethereum,  // or any EIP-1193 provider
  ipfs: 'pinata',
  pinataJwt: RELAY_JWT,
})

// Mode 2: Private key (for autonomous agents, backend scripts)
const sdk = new SDK({
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.AGENT_PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
})

// Mode 3: Read-only (no signing, discovery and reputation queries only)
const sdk = new SDK({ chainId: 8453 })
```

---

## 4. SDKConfig — Full Interface

```typescript
interface SDKConfig {
  chainId: ChainId;                   // required
  rpcUrl?: string;                    // required for write ops with private key
  privateKey?: string;                // private key (preferred)
  signer?: string;                    // private key (legacy alias)
  walletProvider?: Eip1193Provider;   // browser wallet (EIP-6963/EIP-1193)
  registryOverrides?: Record<ChainId, Record<string, Address>>;
  ipfs?: 'node' | 'helia' | 'filecoinPin' | 'pinata';
  ipfsNodeUrl?: string;               // for 'node' IPFS
  filecoinPrivateKey?: string;        // for 'filecoinPin'
  pinataJwt?: string;                 // for 'pinata'
  subgraphUrl?: string;
  subgraphOverrides?: Record<ChainId, string>;
  overrideRpcUrls?: Record<number, string>;
  registrationDataUriMaxBytes?: number; // default 256 KiB (for on-chain storage)
}
```

---

## 5. Agent Registration Flow

```typescript
// Step 1: Create agent object (local, no network calls)
const agent = sdk.createAgent(
  "Scout",
  "Monitors DeFi prices and alerts on anomalies"
)

// Step 2: Configure endpoints and trust model
agent
  .setTrust(true, true)          // reputation + crypto-economic
  .setX402Support(true)          // advertise x402 payment support
  .setActive(true)

// Optionally add service endpoints
await agent.setMCP("https://scout.example.com/mcp", "2025-06-18", true)

// Step 3: Register on-chain (IPFS-backed, recommended)
// → uploads JSON to IPFS → calls register(agentURI) on-chain
// → user signs transaction in their wallet (MetaMask popup)
const txHandle = await agent.registerIPFS()
const mined = await txHandle.waitMined({ timeoutMs: 45000 })
const agentId = mined.result.agentId  // e.g., "8453:36115"

// Step 4: Update later if needed
await agent.setAgentURI("ipfs://QmNew...")
```

**Three storage options for registration:**

| Option | Method | Cost | Decentralization |
|---|---|---|---|
| IPFS-backed (recommended) | `registerIPFS()` | Low | High |
| Fully on-chain data URI | `registerOnChain()` | High (256 KiB limit) | Maximum |
| HTTP endpoint | `registerHTTP(url)` | None | Low (centralized) |

---

## 6. Agent Object — Full API

```typescript
class Agent {
  // Read-only properties
  agentId: AgentId | undefined        // "chainId:tokenId"
  agentURI: URI | undefined
  name: string
  description: string
  image: URI | undefined
  mcpEndpoint: string | undefined
  a2aEndpoint: string | undefined
  walletAddress: Address | undefined
  mcpTools: string[]
  mcpPrompts: string[]
  mcpResources: string[]
  a2aSkills: string[]

  // Configuration (chainable, all return `this`)
  setTrust(reputation: boolean, cryptoEconomic: boolean, teeAttestation?: boolean): this
  setX402Support(enabled: boolean): this
  setActive(active: boolean): this
  setMetadata(kv: Record<string, any>): this
  getMetadata(): Record<string, any>
  delMetadata(key: string): this
  updateInfo(name: string, description: string, image?: URI): this

  // Endpoints
  async setMCP(endpoint: string, version?: string, autoFetch?: boolean): Promise<this>
  async setA2A(agentcard: string, version?: string, autoFetch?: boolean): Promise<this>
  setENS(name: string, version?: string): this
  removeEndpoint(opts?): this

  // OASF taxonomy
  addSkill(slug: string, validateOASF?: boolean): this
  removeSki(slug: string): this
  addDomain(slug: string, validateOASF?: boolean): this
  removeDomain(slug: string): this

  // On-chain write operations
  async registerIPFS(): Promise<TransactionHandle<RegistrationFile>>
  async registerOnChain(): Promise<TransactionHandle<RegistrationFile>>
  async registerHTTP(agentUri: URI): Promise<TransactionHandle<RegistrationFile>>
  async setAgentURI(agentURI: URI): Promise<TransactionHandle<RegistrationFile>>
  async transfer(newOwner: Address): Promise<TransactionHandle>

  // Agent wallet (separate from owner wallet)
  async setWallet(newWallet: Address, opts?): Promise<TransactionHandle<RegistrationFile> | undefined>
  async unsetWallet(): Promise<TransactionHandle>
  getWallet(): Address | undefined

  // A2A messaging
  async messageA2A(content, options?: MessageA2AOptions): Promise<MessageResponse | TaskResponse | A2APaymentRequired<...>>
  async listTasks(options?): Promise<TaskSummary[] | A2APaymentRequired<TaskSummary[]>>
  async loadTask(taskId, options?): Promise<AgentTask | A2APaymentRequired<AgentTask>>

  // Serialization
  getRegistrationFile(): RegistrationFile
}
```

---

## 7. SDK-Level Methods

```typescript
class SDK {
  // Agent management
  createAgent(name: string, description: string, image?: URI): Agent
  async loadAgent(agentId: AgentId): Promise<Agent>
  async getAgent(agentId: AgentId): Promise<AgentSummary | null>
  async searchAgents(filters?: SearchFilters, options?: SearchOptions): Promise<AgentSummary[]>
  async transferAgent(agentId: AgentId, newOwner: Address): Promise<TransactionHandle>
  async isAgentOwner(agentId: AgentId, address: Address): Promise<boolean>
  async getAgentOwner(agentId: AgentId): Promise<Address>
  createA2AClient(agentOrSummary: Agent | AgentSummary): A2AClient

  // Reputation
  prepareFeedbackFile(input: FeedbackFileInput, extra?): FeedbackFileInput
  async giveFeedback(agentId, value, tag1?, tag2?, endpoint?, feedbackFile?, idem?): Promise<TransactionHandle<Feedback>>
  async getFeedback(agentId, clientAddress, feedbackIndex): Promise<Feedback>
  async searchFeedback(filters: FeedbackSearchFilters, options?): Promise<Feedback[]>
  async appendResponse(agentId, clientAddress, feedbackIndex, response): Promise<TransactionHandle>
  async revokeFeedback(agentId, feedbackIndex): Promise<TransactionHandle>
  async getReputationSummary(agentId, tag1?, tag2?): Promise<{ count: number; averageValue: number }>

  // x402 payments
  async request<T>(options: X402RequestOptions<T>): Promise<X402RequestResult<T>>

  // Registry addresses
  identityRegistryAddress(): Address
  reputationRegistryAddress(): Address
  validationRegistryAddress(): Address
}
```

---

## 8. Search and Discovery

Rich filtering across 24+ fields, multi-chain, with semantic search:

```typescript
// Find all bonded/crypto-economic agents on Base
const agents = await sdk.searchAgents({
  chains: [8453],
  supportedTrust: ['crypto-economic'],
  active: true,
})

// Semantic search (keyword triggers vector search)
const agents = await sdk.searchAgents({
  keyword: 'DeFi price monitoring agent',
  hasMCP: true,
})

// Find agents owned by a specific wallet
const myAgents = await sdk.searchAgents({
  owners: ['0x4814d1...'],
  chains: [8453],
})

// Load a specific agent by ID
const agent = await sdk.loadAgent('8453:36105')
console.log(agent.name, agent.agentId)
```

**Two-tier search architecture:**
1. **Subgraph (GraphQL):** Fast indexed queries via The Graph for structured filters
2. **Semantic search:** POST to `https://semantic-search.ag0.xyz/api/v1/search` when `keyword` is present

---

## 9. x402 Payment Integration

```typescript
// Agent calling a paid service
const result = await sdk.request({
  url: 'https://api.example.com/premium-data',
  method: 'GET',
  parseResponse: async (r) => r.json(),
})

if (isX402Required(result)) {
  // Service requires payment — handle the payment
  const data = await result.x402Payment.pay()  // auto-selects best payment option
  // OR: result.x402Payment.payFirst()          // selects first accept with sufficient balance
}
```

**x402 flow:**
1. SDK makes HTTP request
2. Server returns 402 with payment requirements
3. SDK returns `X402RequiredResponse` (no exception thrown)
4. Caller calls `.pay()` — SDK builds EIP-3009 signature, retries with `PAYMENT-SIGNATURE` header
5. Server settles and returns resource

---

## 10. Browser Wallet Discovery (EIP-6963)

```typescript
// Discover all installed wallets (MetaMask, Coinbase, Rabby, etc.)
const wallets = await discoverEip6963Providers({ timeoutMs: 250 })
// Returns: Array<{ info: { name, icon, rdns }, provider: EIP1193Provider }>

// Connect to first available wallet
const { account } = await connectEip1193(wallets[0].provider, { prompt: true })

// Initialize SDK with connected wallet
const sdk = new SDK({
  chainId: 8453,
  walletProvider: wallets[0].provider,
  ipfs: 'pinata',
  pinataJwt: '...',
})
```

---

## 11. TransactionHandle

All write operations return a non-blocking `TransactionHandle<T>`:

```typescript
const txHandle = await agent.registerIPFS()
// Transaction is already submitted

const mined = await txHandle.waitMined({
  timeoutMs: 45000,
  throwOnRevert: true,
})

console.log(mined.result.agentId)   // typed result
console.log(txHandle.hash)          // tx hash for explorer links
```

---

## 12. Key Types Summary

```typescript
type AgentId = string           // "chainId:tokenId" e.g. "8453:36105"
type ChainId = number           // numeric chain ID
type Address = string           // 0x-prefixed Ethereum address
type URI = string               // https:// or ipfs://
type CID = string               // IPFS Content Identifier

enum TrustModel {
  REPUTATION = 'reputation',
  CRYPTO_ECONOMIC = 'crypto-economic',
  TEE_ATTESTATION = 'tee-attestation',
}

interface RegistrationFile {
  agentId?: AgentId
  agentURI?: URI
  name: string
  description: string
  image?: URI
  walletAddress?: Address
  endpoints: Endpoint[]
  trustModels: (TrustModel | string)[]
  owners: Address[]
  operators: Address[]
  active: boolean
  x402support: boolean
  metadata: Record<string, any>
  updatedAt: Timestamp
}

interface AgentSummary {
  chainId: number
  agentId: AgentId
  name: string
  description: string
  owners: Address[]
  supportedTrusts: string[]
  mcpTools: string[]
  a2aSkills: string[]
  active: boolean
  x402support: boolean
  feedbackCount?: number
  averageValue?: number
  // ... more fields
}
```

---

## 13. Contract Addresses (Base Mainnet — Chain ID 8453)

Same addresses as Ethereum mainnet — consistent across all supported chains:

| Registry | Address |
|---|---|
| Identity Registry (ERC-721) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

These match Syntrophic's deployed contracts exactly.

---

## 14. IPFS Provider Options

| Option | Config key | Notes |
|---|---|---|
| Pinata | `ipfs: 'pinata'`, `pinataJwt: '...'` | Recommended, free for ERC-8004 agents |
| Helia (embedded) | `ipfs: 'helia'` | In-process, no external dependency |
| Filecoin | `ipfs: 'filecoinPin'`, `filecoinPrivateKey: '...'` | Decentralized, proof-verified |
| Kubo daemon | `ipfs: 'node'`, `ipfsNodeUrl: '...'` | Self-hosted |

**IPFS gateway fallback chain:** `gateway.pinata.cloud` → `ipfs.io` → `dweb.link`

---

## 15. OASF Taxonomy

136 standard skills and 204 domains from Open Agentic Schema Framework v0.8.0. Used for interoperable capability advertising and subgraph filtering:

```typescript
agent
  .addSkill("data_engineering/data_transformation_pipeline")
  .addDomain("finance_and_business/investment_services")
```

---

## 16. Ecosystem and Community

- **Telegram:** t.me/agent0kitchen
- **Docs:** https://sdk.ag0.xyz/docs
- **GitHub (TS):** https://github.com/agent0lab/agent0-ts
- **GitHub (Python):** https://github.com/agent0lab/agent0-py
- **Semantic search service:** https://semantic-search.ag0.xyz
- **Status:** Beta, actively maintained
- **Explorer:** 8004scan.io (115K+ agents indexed)
