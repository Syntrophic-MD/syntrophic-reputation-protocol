# Syntrophic Reputation Protocol (SRP) Audit Report

**Audit date:** 2026-03-23 to 2026-03-24  
**Report version:** v1.0  
**Network:** Base mainnet  
**Auditor:** Codex execution agent (implementation audit during live operations)

## 1. Executive Summary
This audit reviewed the deployed SBP bonding, metadata, scoring, and slashing flows used with ERC-8004 agents. Core bonding logic is operational, but the system currently allows state divergence between vault truth and ERC-8004 metadata projection, and does not enforce an atomic score-to-slash transition onchain.

### Key outcomes
- Bonding transactions succeeded for target agents.
- Metadata sync did not occur for some bonded agents when adapter authorization was missing at bond time.
- Post-authorization metadata backfill is not available in current deployed adapter flow.
- Slashing is signature-gated, but not automatically triggered when score crosses threshold.
- Slash eligibility is attestation-driven and not bound to current stored vault score.
- Feedback ingestion requirements for SBP scoring are under-documented and operationally hard to execute correctly.

### Risk summary
- High: 3 findings
- Medium: 3 findings
- Low: 2 findings

## 2. Scope
### In-scope components
- SBP Vault (`0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`)
- ERC-8004 Registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`)
- ERC-8004 Registry Adapter (`0x63DCE10906BB3D3C8280A3fa578594D261C4b804`)
- Feedback + score/slash operational flow (as executed from runbook/skill instructions)

### Out-of-scope
- Full formal verification
- Economic game-theory proofs
- Frontend scanner implementation internals

## 3. Methodology
- Live transaction execution and state verification on Base mainnet.
- Contract behavior inspection from fetched source artifacts.
- Reproduction of bonding, approval, feedback, score update, and unstake paths.
- Comparison of vault state vs ERC-8004 metadata state.

## 4. Findings Overview
| ID | Severity | Title | Status |
|---|---|---|---|
| SBP-01 | High | Bond and metadata sync are not atomic | Open |
| SBP-02 | Medium | No post-hoc metadata backfill path | Open |
| SBP-03 | High | No guaranteed automatic slash on threshold crossing | Open |
| SBP-04 | High | Slash condition not bound to stored vault score | Open |
| SBP-05 | Medium | Slashing authority concentrated in single signer trust domain | Open |
| SBP-06 | Medium | Feedback flow required for score/slash is under-specified | Open |
| SBP-07 | Low | Runbook lacks preflight and mode selection gates | Open |
| SBP-08 | Low | Operational observability gap between vault and metadata states | Open |

## 5. Detailed Findings

### SBP-01: Bond and metadata sync are not atomic
**Severity:** High  
**Affected components:** Vault -> Adapter integration

**Description**  
Bond state can succeed while metadata sync silently skips. This creates inconsistent protocol state where `isBonded=true` but ERC-8004 metadata (`syntrophic.status`) remains unset.

**Evidence**
- Vault callback path to adapter: [Contract.sol:219](/Users/agentbook/code/agent-onboarding/.secrets/abi_fetch/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248/SBPVault/Contract.sol:219)
- Adapter skip behavior when unauthorized: [Contract.sol:106](/Users/agentbook/code/agent-onboarding/.secrets/abi_fetch/0x63DCE10906BB3D3C8280A3fa578594D261C4b804/ERC8004RegistryAdapter/Contract.sol:106)
- Bonded agents with `syntrophic.status=0x` observed during test window.

**Impact**
- Scanner and integrator confusion.
- Compliance/UX mismatch: "bonded" state may not appear in metadata-based consumers.
- Recovery currently requires extra operational steps.

**Recommended remediation**
1. Add strict mode for bond path: revert bond when metadata sync fails.
2. Keep optional best-effort mode only when explicitly selected.

**Implementation guidance**
- Add bond API mode flag, e.g., `bond(..., requireMetadataSync)`.
- In strict mode, propagate adapter failure (no silent skip).
- Emit explicit events for both strict and best-effort paths.

**Acceptance criteria**
- In strict mode, unauthorized adapter causes transaction revert.
- In best-effort mode, skip is explicit and user-selected.

---

### SBP-02: No post-hoc metadata backfill path
**Severity:** Medium  
**Affected components:** ERC-8004 Registry Adapter

**Description**  
After adapter authorization is fixed, there is no public sync function to backfill metadata for already-bonded agents.

**Evidence**
- Only lifecycle callback paths (`onBond`, `onSlash`, `onWithdraw`) write metadata.
- No replay function exposed for existing bond state.

**Impact**
- Forces unbond/rebond or additional custom intervention.
- Extends inconsistency window and increases gas overhead.

**Recommended remediation**
1. Add public/idempotent sync entrypoint, e.g., `syncBondMetadata(agentId)`.
2. Validate current vault state and write derived metadata deterministically.

**Implementation guidance**
- Access control: owner/authorized operator/permissionless with state checks.
- Emit `MetadataSynced(agentId, status, score, reviewCount)`.
- Ensure idempotency and replay safety.

**Acceptance criteria**
- Authorized operator can backfill metadata without unbond/rebond.
- Repeated calls do not mutate state beyond deterministic projection.

---

### SBP-03: No guaranteed automatic slash on threshold crossing
**Severity:** High  
**Affected components:** Score update and slash execution flow

**Description**  
Score dropping below threshold does not automatically slash in the same onchain transition. Slashing requires a separate valid slash attestation + transaction.

**Evidence**
- `updateScore(...)` updates score state but does not finalize slash.
- `executeSlash(...)` is separate path.

**Impact**
- Policy intent (automatic slash on threshold breach) is not guaranteed by contract logic alone.
- If automation/relayer fails, under-threshold bonds can remain active.

**Recommended remediation**
1. Add atomic mode: if score update crosses threshold and bond active, execute slash in same flow.
2. If non-atomic remains, enforce bounded SLA via keeper + onchain stale-state guard.

**Implementation guidance**
- Option A: internal slash in `updateScore` when threshold violated.
- Option B: mandatory queue with expiry after which anyone can finalize with proof.

**Acceptance criteria**
- Threshold breach cannot remain active indefinitely due to relayer dependency.
- Slash behavior is deterministic and documented.

---

### SBP-04: Slash condition not bound to stored vault score
**Severity:** High  
**Affected components:** `executeSlash` validation

**Description**  
Current slash check validates attested score against threshold, but does not enforce equivalence with current stored vault score at execution time.

**Evidence**
- Slash condition checks `attestation.score < SLASH_THRESHOLD`.
- No strict equality check against current persisted bond score.

**Impact**
- Slash truth is controlled by attestation policy timing rather than hard linkage to current onchain state.
- Raises correctness risk for stale/out-of-order attestations.

**Recommended remediation**
1. Bind slash eligibility to current stored score and version/nonce.
2. Enforce monotonic attestation nonce and freshness windows.

**Implementation guidance**
- Require `attestation.score == bond.score` and `attestation.reviewCount == bond.reviewCount` (or a version hash).
- Include `deadline` + `nonce` in signed payload; reject stale signatures.

**Acceptance criteria**
- Stale or mismatched attestations cannot slash active bonds.
- Slash can only finalize from current canonical score state.

---

### SBP-05: Slashing authority concentrated in single signer trust domain
**Severity:** Medium  
**Affected components:** Signature trust model

**Description**  
`executeSlash` is externally callable and protected by signature verification from `roflSigner`. Caller is not role-restricted; signature validity is the primary gate.

**Evidence**
- External slash entrypoint with signature gate.
- Deployment signer observed: `0x5deb87fF19BBeCFc9928eD5B3801736AfFB4359D`.

**Impact**
- If signer key is compromised, attacker can authorize slashes.
- Operationally centralizes critical safety action.

**Recommended remediation**
1. Move to threshold signer/multisig-backed attestation authority.
2. Add signer rotation and emergency pause procedures.

**Implementation guidance**
- Replace single EOA with smart-account or threshold scheme.
- Emit signer-change events and maintain audit trail.

**Acceptance criteria**
- Compromise of single key cannot unilaterally slash all bonds.
- Rotations can be executed safely and quickly.

---

### SBP-06: Feedback flow required for score/slash is under-specified
**Severity:** Medium  
**Affected components:** Docs/runbooks/tooling

**Description**  
Raw ERC-8004 feedback submissions do not directly update SBP vault score/slash state. The required compatible flow (feedback plus attestation-driven score update) is not clear enough in operational docs.

**Evidence**
- Feedback tx path discovered via tracing to `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`:
  `giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)`
- Vault state changes required separate signed `updateScore(...)` transactions.

**Impact**
- Operators may believe feedback alone is sufficient to trigger SBP economics.
- High chance of incomplete state transitions and false expectations.

**Recommended remediation**
1. Publish explicit compatibility matrix for feedback formats and score bridge rules.
2. Provide official wrapper tooling: `submitFeedbackAndScore(...)` workflow.
3. Add preflight checks for signer capability before execution.

**Implementation guidance**
- Update `skill.md` with exact contract/function payload examples.
- Add CLI script that performs both steps or warns clearly when second step is unavailable.

**Acceptance criteria**
- Operators can execute SBP-compatible feedback flows without reverse-engineering scanner txs.
- Docs clearly separate raw feedback recording from score/slash state updates.

---

### SBP-07: Runbook lacks preflight and mode selection gates
**Severity:** Low  
**Affected components:** Operator workflow

**Description**  
Runbook flow does not require checks for adapter authorization, signer roles, mode selection (`bond-only` vs `bond+metadata`), or expected slash automation behavior.

**Impact**
- Repeated operator errors and avoidable gas expenditure.

**Recommended remediation**
1. Add mandatory preflight script.
2. Block execution unless user confirms selected operating mode.

**Acceptance criteria**
- Execution cannot proceed until required prerequisites are verified.

---

### SBP-08: Operational observability gap between vault and metadata states
**Severity:** Low  
**Affected components:** Monitoring/UI/ops reporting

**Description**  
Current scanner views can lead operators to infer protocol state from metadata alone, while vault state may differ.

**Impact**
- Slower incident detection and incorrect runbook decisions.

**Recommended remediation**
1. Expose both states in monitoring dashboards: vault truth and metadata projection.
2. Alert on divergence duration above threshold.

**Acceptance criteria**
- Ops receives automatic alert when bonded state and metadata state diverge.

## 6. Reproduced Onchain Evidence
### Bonding and approval sequence
- Bond txs:
  - `#223 (36105)`: `0xc326d4a7ac263ac3cfba228f19199bac26b8df86a20861ba0be0fc31cdc9cdd4`
  - `#224 (36109)`: `0xb06f8c916ffd0ac8e7577bff8e526f2fc60486b1f542801bd12e4599305e1185`
  - `#225 (36110)`: `0xd0c763ecf468982c96ddeaba0a35064fd9dfc6f32154bc19720560edc099f5a9`
- Adapter approvals (`setApprovalForAll(adapter,true)`):
  - `36105`: `0xd31e711fffe82f3fb1e75dcc235854ea690d5c8b4b57d31817fa117e13cbc250`
  - `36109`: `0x174ba9978ae011dcc40fdd70f09b3e59799cb9238ba2161ea6be57e46cf08f8d`
  - `36110`: `0xed02e45c152b5c3edc13a5e466f2044f8bc43522d626abcbeb19c97cba67e733`
- Unstake requests used for lifecycle re-trigger path:
  - `0x25793e2ddb3a2587da703cf7c64424e1b6837ffe035871626b4374eb84f9f7fc`
  - `0xc019db1ec4ec50310f60db77ebb1cdbe773e696512c3fefd9e4fda0f9f9430f2`
  - `0x10edafecdedadd84e129c03844a7872affa0e5b5d67fa8a9829f109f62507e86`

### Feedback and score update evidence
- Feedback submissions:
  - Positive-style: `0x5eeb77045a25371d49025331dc9fbd244efd66bfa8983f65da52fc4c4a908c9b`
  - Negative-style: `0xca12dbce8072796eb6d9b8427791b4fb7294e70d8ecef23ab8914a817b928652`
- Score attestations:
  - `36105` -> `score=95, reviewCount=1`: `0x50469bf72db7bd681181347cd41fa8cd31b67daf918ada417055456bd0a1d323`
  - `36110` -> `score=20, reviewCount=1`: `0x2f6883b4eaa1341fb8ef2b309b4b697da75543f391bf277cd7a079cbe0511e38`

## 7. Prioritized Remediation Plan
### Phase 0 (Immediate)
1. Publish updated runbook with mandatory preflight checks and explicit operating modes.
2. Add operator warning that score threshold breach is not guaranteed to slash without separate slash execution.
3. Add monitoring alert for `isBonded=true` and `syntrophic.status=0x` divergence.

### Phase 1 (Short sprint)
1. Add adapter backfill method (`syncBondMetadata`).
2. Add nonces/deadlines to score/slash attestations if not already enforced.
3. Ship reference CLI: `feedback-only` and `feedback-plus-score` modes.

### Phase 2 (Protocol hardening)
1. Introduce atomic slash behavior or enforce deterministic finalization guarantees.
2. Bind slash eligibility to canonical stored vault score/version.
3. Replace single signer trust with threshold signing and rotation governance.

## 8. Developer Handoff Checklist
- [ ] Implement strict/best-effort bond mode separation.
- [ ] Implement metadata backfill sync path.
- [ ] Add slash validation linkage to current vault score/version.
- [ ] Define and enforce attestation freshness and replay protections.
- [ ] Publish SBP feedback compatibility spec and wrapper tooling.
- [ ] Add onchain/offchain monitors for state divergence and slash latency.

## 9. Conclusion
SBP core functions are working, but production safety and operator reliability depend on improvements to atomicity, canonical score linkage, and documentation/tooling clarity. The findings above are actionable and can be implemented incrementally without changing the high-level protocol purpose.
