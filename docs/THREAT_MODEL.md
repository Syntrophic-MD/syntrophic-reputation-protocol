# Syntrophic Threat Model

## Scope

This document covers the hackathon MVP for sponsored ERC-8004 onboarding on Base:

- quote creation,
- x402-gated launch execution,
- IPFS metadata publication,
- sponsored Base transaction submission,
- ERC-8004 registration plus SRP bonding,
- proof bundle generation.

It does not attempt to fully model future multi-chain execution, marketplace flows, or sponsored bonding for already-registered agents.

## Security Goals

- A launch should only execute after valid payment on the paid endpoint.
- The beneficiary should end up as the owner of the ERC-8004 identity.
- The bond should be posted onchain in the SRP vault on Base.
- The proof bundle should reflect actual chain state, not just queued intent.
- Failure should not silently mint an unbonded identity while claiming success.

## Trust Assumptions

The MVP intentionally relies on several trusted components:

- Syntrophic sponsor key submits the Base transaction.
- Pinata pins the ERC-8004 registration file.
- The configured x402 facilitator verifies and settles payment.
- The ERC-8004 registry and SRP contracts behave as deployed on Base.
- The current ROFL validation path remains single-signer for score/slash updates.

These are acceptable hackathon assumptions, but they are not the final decentralization target.

## Main Threats

### 1. Unpaid launch execution

Risk:
An attacker triggers sponsored onboarding without actually paying.

Current mitigation:
- the quote-scoped launch endpoint is x402-protected,
- launch execution is only attempted after payment verification,
- settlement happens only after a successful response is prepared.

Residual risk:
- quote-specific business constraints are still enforced by app logic, not by custom x402 extensions.

## 2. Sponsor key compromise

Risk:
If the sponsor key is leaked, an attacker can submit Base transactions and drain onboarding funds.

Current mitigation:
- sponsor key is server-side only,
- `.env` secrets are excluded from git,
- separate env vars are used for the sponsor execution path.

Residual risk:
- the MVP still depends on a hot operational key.

## 3. Metadata mismatch

Risk:
Pinned metadata does not match what the user intended, or the proof bundle claims more than what was written onchain.

Current mitigation:
- profile input is normalized and validated before execution,
- proof bundle fields are derived from post-transaction chain reads.

Residual risk:
- the metadata file itself is pinned through a trusted third-party gateway.

## 4. Partial execution failure

Risk:
Payment succeeds but onboarding fails partway through.

Current mitigation:
- the paid route only settles after a successful application response,
- onchain execution is atomic inside `SyntrophicSponsoredOnboarder.onboardFor(...)`,
- proof is only returned after the transaction receipt is confirmed.

Residual risk:
- offchain pre-chain steps like IPFS publication can still fail before the transaction is sent.

## 5. Weak economic deterrence

Risk:
The bond is too small to function as a meaningful deterrent.

Current mitigation:
- none at the protocol economics layer beyond transparency.

Residual risk:
- `BOND_AMOUNT = 0.00001 ETH` is hackathon-calibrated and not production strength.

## 6. Centralized reputation authority

Risk:
Score/slash authority is too centralized to be trusted broadly.

Current mitigation:
- trust state transitions are explicit and onchain,
- signatures are verifiable,
- slashing logic is auditable.

Residual risk:
- current ROFL attestation authority is single-signer.

## 7. External dependency fragility

Risk:
The demo relies on upstream services like the facilitator, Base RPC, Pinata, and external agent scanners.

Current mitigation:
- proof bundle uses direct chain reads after transaction confirmation,
- the core trust state lives onchain.

Residual risk:
- the current explorer and ecosystem visibility still depend on external indexing behavior.

## Non-Goals For MVP

- censorship resistance against all infrastructure providers
- trust-minimized asset conversion between x402 proceeds and sponsor treasury management
- trustless IPFS persistence guarantees
- decentralized multi-signer attestation governance
- strict cross-chain atomic settlement

## Operational Recommendations

- keep sponsor funds limited to demo needs,
- rotate sponsor keys after public demos,
- keep x402 pay-to and sponsor execution addresses separate if possible,
- archive proof bundles for every live demo launch,
- manually verify each demo agent on Base before presenting.

## Future Hardening

- bind quote identity into x402 extensions for stronger payment-to-request linkage,
- replace hot-key sponsorship with safer operational controls,
- add a first-party indexer for bonded agent discovery,
- add multi-signer or committee-based ROFL attestation authority,
- support sponsored bonding for already-registered agents via signed owner authorization,
- support user-selected single-payment multi-chain launch bundles.
