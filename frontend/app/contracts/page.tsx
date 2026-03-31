import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { GlassCard } from '@/components/ui'

export const metadata = {
  title: 'Contracts — Syntrophic.md',
  description:
    'Syntrophic Reputation Protocol contracts and Base mainnet deployment report: addresses, transactions, and verification steps.',
}

function AddressLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--accent)' }}>
      {label}
    </a>
  )
}

export default function ContractsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ color: 'var(--foreground)' }}>
      <Navbar />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <GlassCard elevated className="p-8 md:p-12 flex flex-col gap-8">
            <div className="flex flex-col gap-2 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Base mainnet deployment report and verification guide for Syntrophic smart contracts.
              </p>
              <div className="flex flex-col gap-0.5 pt-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <span>Date: March 22-23, 2026 (CDT/UTC)</span>
                <span>Network: Base Mainnet (Chain ID 8453)</span>
                <span>Agent ID: 32055</span>
              </div>
            </div>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">1) What We Built and Deployed</h2>
              <ul className="flex flex-col gap-2 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  ERC8004RegistryAdapter (writes syntrophic metadata)
                  <div>
                    Address: <code className="text-xs">0x63DCE10906BB3D3C8280A3fa578594D261C4b804</code>
                  </div>
                  <div>
                    BaseScan:{' '}
                    <AddressLink
                      href="https://basescan.org/address/0x63DCE10906BB3D3C8280A3fa578594D261C4b804"
                      label="0x63DCE109...C4b804"
                    />
                  </div>
                </li>
                <li>
                  SRPVault (bonding/staking logic)
                  <div>
                    Address: <code className="text-xs">0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248</code>
                  </div>
                  <div>
                    BaseScan:{' '}
                    <AddressLink
                      href="https://basescan.org/address/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248"
                      label="0xb3E75c11...8d1248"
                    />
                  </div>
                </li>
                <li>
                  ERC-8004 Registry: <code className="text-xs">0x8004A169FB4a3325136EB29fA0ceB6D2e539a432</code>
                  <div>
                    BaseScan read proxy:{' '}
                    <AddressLink
                      href="https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432#readProxyContract"
                      label="Open Read Contract"
                    />
                  </div>
                </li>
                <li>
                  Bond amount configured in vault: <code className="text-xs">0.00001 ETH</code> (<code className="text-xs">10000000000000</code> wei)
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">2) Mainnet Transactions Executed</h2>

              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Deployment and wiring:
              </div>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  Adapter deploy:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x9e994f987f4f1c5592b290ada2ed79698413f4a42851f3456ed1246f9ed2529f"
                    label="tx 0x9e994f...2529f"
                  />
                </li>
                <li>
                  Vault deploy:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x4de898a73c0539e1570ee7f36e94304498ffe0f68cdeb09002a8a5fc727d816b"
                    label="tx 0x4de898...7d816b"
                  />
                </li>
                <li>
                  Adapter setVault:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x39ed6533cdcc7584816b99ab2919d647081cc014f7d820f11739c9af94a4b56d"
                    label="tx 0x39ed65...a4b56d"
                  />
                </li>
              </ul>

              <div className="text-sm pt-2" style={{ color: 'var(--muted-foreground)' }}>
                First live bond:
              </div>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  bond(32055):{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0xbdde5bc2c76c40c70072ad36a3ee3d396910d34c25cd0873ef1e8880a2696e52"
                    label="tx 0xbdde5b...696e52"
                  />
                </li>
              </ul>

              <div className="text-sm pt-2" style={{ color: 'var(--muted-foreground)' }}>
                Authorization + metadata backfill:
              </div>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  Approval correction:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x75d39d4b56ccefb13584d9ebad9ea848678e73660509251d89f067dd3b5809e0"
                    label="tx 0x75d39d...809e0"
                  />
                </li>
                <li>
                  setApprovalForAll:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x4aa7426804fe5a6295a8bcf4a7aa3698ee18476cc93c8971275dd1ccef0cdd80"
                    label="tx 0x4aa742...cdd80"
                  />
                </li>
                <li>
                  syntrophic.validator:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0xe4f22784bfbd098929dac8c9888fada538e9e7afe7baf5e54bf0c97a7cbfea20"
                    label="tx 0xe4f227...fea20"
                  />
                </li>
                <li>
                  syntrophic.status:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0xf8fff1c192cc87b1785b2e4b1935b46fb56eaecc87817651d4c41414838edb0f"
                    label="tx 0xf8fff1...edb0f"
                  />
                </li>
                <li>
                  syntrophic.score:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x53745fdcf83761d1f777b89b188a2927e21d1874a64e7c3539e2982d7e250dd3"
                    label="tx 0x53745f...50dd3"
                  />
                </li>
                <li>
                  syntrophic.reviewCount:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0x5ef05b344257b97bf78603fde1646933ef6c58d10886de6496c00cb5970ca565"
                    label="tx 0x5ef05b...ca565"
                  />
                </li>
                <li>
                  syntrophic.updatedAt:{' '}
                  <AddressLink
                    href="https://basescan.org/tx/0xcea137f6be4fa2984b9e1bc89d97f7df2f818764a4522070ec1109b26b343743"
                    label="tx 0xcea137...43743"
                  />
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">3) Current On-Chain State (Expected)</h2>
              <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Vault:
              </div>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  <code className="text-xs">isBonded(32055) = true</code>
                </li>
                <li>
                  <code className="text-xs">getBondStatus(32055)</code> shows staker <code className="text-xs">0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D</code>, amount <code className="text-xs">10000000000000</code>, score <code className="text-xs">100</code>.
                </li>
              </ul>

              <div className="text-sm pt-1" style={{ color: 'var(--muted-foreground)' }}>
                ERC-8004 metadata keys:
              </div>
              <ul className="flex flex-col gap-1 list-disc list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  <code className="text-xs">syntrophic.status = 0x424f4e444544</code> (BONDED)
                </li>
                <li>
                  <code className="text-xs">syntrophic.score = 100</code>
                </li>
                <li>
                  <code className="text-xs">syntrophic.reviewCount = 0</code>
                </li>
                <li>
                  <code className="text-xs">syntrophic.updatedAt = 1774233303</code> (2026-03-23 02:35:03 UTC)
                </li>
                <li>
                  <code className="text-xs">syntrophic.validator = 0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248</code>
                </li>
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">4) How to Verify On-Chain (UI)</h2>
              <ol className="flex flex-col gap-2 list-decimal list-inside text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <li>
                  Open ERC-8004 registry read page:{' '}
                  <AddressLink
                    href="https://basescan.org/address/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432#readProxyContract"
                    label="Read Proxy Contract"
                  />
                </li>
                <li>
                  Run <code className="text-xs">getMetadata(uint256,string)</code> with <code className="text-xs">agentId=32055</code> for:
                  <div><code className="text-xs">syntrophic.status</code></div>
                  <div><code className="text-xs">syntrophic.score</code></div>
                  <div><code className="text-xs">syntrophic.reviewCount</code></div>
                  <div><code className="text-xs">syntrophic.updatedAt</code></div>
                  <div><code className="text-xs">syntrophic.validator</code></div>
                </li>
                <li>
                  Optional vault checks:{' '}
                  <AddressLink
                    href="https://basescan.org/address/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248#readContract"
                    label="SRPVault Read Contract"
                  />
                  {' '}and call <code className="text-xs">isBonded(32055)</code> and <code className="text-xs">getBondStatus(32055)</code>.
                </li>
              </ol>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">5) How to Verify On-Chain (CLI)</h2>
              <pre
                className="text-xs leading-relaxed overflow-x-auto p-4 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--muted-foreground)' }}
              >{`cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.status" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.score" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.reviewCount" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.updatedAt" --rpc-url https://mainnet.base.org
cast call 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 "getMetadata(uint256,string)(bytes)" 32055 "syntrophic.validator" --rpc-url https://mainnet.base.org

cast --to-ascii 0x424f4e444544
cast --to-dec 0x0000000000000000000000000000000000000000000000000000000000000064
cast --to-dec 0x0000000000000000000000000000000000000000000000000000000069c0a6d7
cast parse-bytes32-address 0x000000000000000000000000b3e75c11957a23f9a8df2a2eb59513832c8d1248`}</pre>
            </section>

            <section className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-lg font-bold">6) Note on Agent Scanner UI</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                You may not immediately see <code className="text-xs">syntrophic.*</code> labels rendered in scanner UIs due to indexer/parser timing.
                BaseScan read calls are the source of truth for on-chain state.
              </p>
            </section>
          </GlassCard>
        </div>
      </main>

      <Footer />
    </div>
  )
}
