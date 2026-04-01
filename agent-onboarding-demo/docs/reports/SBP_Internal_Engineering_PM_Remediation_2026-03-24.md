# SBP Internal Engineering + Product Remediation Memo (2026-03-24)

**Audience:** Protocol engineers, backend engineers, product managers, DevRel/Docs owners  
**Distribution:** Internal only  
**Source of truth for evidence:** `SBP_Bonding_Metadata_Incident_2026-03-23.md` (audit report)

## 1. Purpose
This memo converts the SBP audit findings into a decision-ready internal plan so engineering and product can align on target behavior, choose implementation strategy, and execute fixes with clear acceptance criteria.

## 2. Current-State Facts (Observed)
1. Bonding can succeed while ERC-8004 metadata sync is skipped when adapter authorization is missing.
2. There is no post-hoc metadata backfill function for already-bonded agents.
3. Score updates and slashing are separate flows; threshold crossing does not guarantee immediate slash finalization.
4. Slash validation is attestation-driven and not strictly tied to current stored vault score/version.
5. Slash execution authority is signature-gated by a single `roflSigner` trust domain.
6. ERC-8004 raw feedback and SBP vault score/slash are separate operational steps.
7. Runbooks do not enforce preflight checks and operating mode selection.
8. Monitoring/UI can present metadata projection without clearly separating vault truth.

## 3. Product Risk Framing (Why This Matters)
1. **User trust risk:** Users can see “bonded” in one system and “not bonded” in another.
2. **Policy enforcement risk:** “Auto-slash below threshold” is not guaranteed by the current transaction path.
3. **Operational fragility:** Correct execution depends on undocumented sequencing and signer/relayer availability.
4. **Incident recurrence risk:** Same classes of inconsistency are repeatable without protocol and runbook changes.

## 4. Decision Areas and Recommended Direction

### 4.1 Bonding + Metadata Consistency
**Decision to make:** Should SBP default to atomic bond+metadata, or continue with best-effort sync?

**Option A: Strict atomic by default**
- Bond reverts if metadata cannot be written.
- Pros: single-source observable state, lower operator confusion.
- Cons: more preconditions at bonding time.

**Option B: Dual mode (`strict` + `best-effort`) with explicit selection**
- Caller chooses behavior per transaction.
- Pros: flexibility for advanced integrations.
- Cons: more complexity and potential misuse.

**Recommended:** Option B, with `strict` as default in first-party tooling.

### 4.2 Threshold Crossing and Slash Finalization
**Decision to make:** How to guarantee slash behavior when score crosses threshold?

**Option A: Fully atomic in `updateScore`**
- Threshold crossing finalizes slash in the same call path.
- Pros: deterministic enforcement.
- Cons: larger contract behavior change.

**Option B: Two-step with protocol-enforced finalization guarantees**
- Keep `updateScore` + `executeSlash` split, but add enforceable freshness/queue/finalize rules.
- Pros: less disruptive migration.
- Cons: still multi-transaction.

**Recommended:** Phase approach.
1. Short term: Option B with hard constraints.
2. Medium term: Evaluate Option A for stronger guarantees.

### 4.3 Slash Correctness Guardrails
**Decision to make:** What must be true for a slash attestation to be accepted?

**Recommended mandatory checks:**
1. Attested score/reviewCount must match canonical stored bond state (or equivalent version hash).
2. Signed payload must include nonce and deadline.
3. Replay/stale attestations must be rejected onchain.

### 4.4 Signer Trust Model
**Decision to make:** Keep single signer or move to threshold signer model?

**Recommended:** Move to threshold/multisig attestation authority with documented rotation and emergency procedure.

### 4.5 Feedback Compatibility Contract
**Decision to make:** Keep current implicit feedback expectations or publish explicit compatibility contract?

**Recommended:** Publish explicit compatibility matrix + wrapper tooling (`feedback-only` vs `feedback-plus-score`).

## 5. Target Behavior Contract (Internal Product Spec)
After remediation, the system should satisfy:
1. Bonding mode is explicit; first-party path defaults to strict bond+metadata sync.
2. Metadata can be backfilled safely without unbond/rebond.
3. Threshold policy cannot stay unenforced indefinitely due to relayer downtime.
4. Slash eligibility is bound to canonical stored score/version.
5. Attestation trust is not dependent on a single non-rotated EOA.
6. Feedback docs/tooling make it clear when SBP vault state changes versus when only raw feedback is recorded.
7. Dashboards present both vault truth and metadata projection with divergence alerts.

## 6. Engineering Backlog (One Ticket per Audit Finding)

### SBP-ENG-01 (maps to SBP-01)
**Title:** Add strict/best-effort bond mode and make strict default in first-party flows  
**Priority:** P0  
**Owner role:** Protocol + SDK/CLI  
**Size:** M

**Scope**
1. Add mode flag to bond path.
2. Strict mode reverts on metadata sync failure.
3. Best-effort mode emits explicit skipped-sync event.

**Acceptance criteria**
1. Strict mode unauthorized adapter causes revert.
2. Best-effort mode succeeds with explicit skip event.
3. First-party scripts default to strict mode.

---

### SBP-ENG-02 (maps to SBP-02)
**Title:** Implement idempotent metadata backfill endpoint  
**Priority:** P1  
**Owner role:** Protocol  
**Size:** M

**Scope**
1. Add `syncBondMetadata(agentId)` (or equivalent).
2. Validate current vault state before writing metadata.
3. Emit sync event with projected fields.

**Acceptance criteria**
1. Backfill works for previously bonded agents.
2. Repeated calls are safe and deterministic.

---

### SBP-ENG-03 (maps to SBP-03)
**Title:** Guarantee slash finalization after threshold crossing  
**Priority:** P0  
**Owner role:** Protocol + Infra/Keeper  
**Size:** L

**Scope**
1. Implement enforceable finalization path (short-term two-step hardening).
2. Define bounded slash latency objective.
3. Add keeper alerting and fallback finalization mechanics.

**Acceptance criteria**
1. Under-threshold active bonds cannot remain unresolved beyond configured SLA.
2. SLA breach triggers operational alert.

---

### SBP-ENG-04 (maps to SBP-04)
**Title:** Bind slash attestations to canonical stored score/version  
**Priority:** P0  
**Owner role:** Protocol  
**Size:** M

**Scope**
1. Add score/reviewCount or state-hash equivalence checks.
2. Add nonce/deadline verification.
3. Reject stale/replayed attestations.

**Acceptance criteria**
1. Stale payloads revert.
2. Mismatched score/version payloads revert.

---

### SBP-ENG-05 (maps to SBP-05)
**Title:** Replace single signer trust with threshold signer governance  
**Priority:** P1  
**Owner role:** Protocol + Security + PM  
**Size:** L

**Scope**
1. Move attestation authority to multisig/threshold signer.
2. Implement signer rotation flow.
3. Define emergency response playbook.

**Acceptance criteria**
1. Single key compromise is insufficient for unilateral slash authorization.
2. Rotation can be executed without downtime.

---

### SBP-ENG-06 (maps to SBP-06)
**Title:** Ship explicit feedback compatibility spec and wrapper tooling  
**Priority:** P1  
**Owner role:** DevRel/Docs + SDK/CLI + PM  
**Size:** M

**Scope**
1. Document exact compatible feedback contract/function and payload expectations.
2. Provide wrapper commands for `feedback-only` and `feedback-plus-score`.
3. Add signer-role preflight checks.

**Acceptance criteria**
1. Operators can execute compatible feedback flow without reverse-engineering scanner txs.
2. Docs explicitly distinguish feedback recording vs vault state update.

---

### SBP-ENG-07 (maps to SBP-07)
**Title:** Enforce preflight gates in runbooks and scripts  
**Priority:** P1  
**Owner role:** DevEx/Tooling + PM  
**Size:** S

**Scope**
1. Add mandatory checks: adapter authorization, signer capability, selected operating mode.
2. Block execution when prerequisites fail.

**Acceptance criteria**
1. First-party scripts fail fast with actionable errors.
2. User must explicitly confirm bond mode.

---

### SBP-ENG-08 (maps to SBP-08)
**Title:** Add observability for vault/metadata divergence and slash latency  
**Priority:** P1  
**Owner role:** Backend/Infra + PM  
**Size:** M

**Scope**
1. Expose vault truth and metadata projection in dashboards.
2. Alert on divergence age and slash-latency SLA breaches.

**Acceptance criteria**
1. Divergence is measurable per agent and over time.
2. Alerts route to responsible on-call owner.

## 7. PM Workstream (Required)
1. Approve target behavior contract in Section 5.
2. Define migration strategy for existing bonded agents.
3. Set external expectation language for “bonded” and “slashed” semantics.
4. Approve SLA targets for slash finalization and metadata sync.

## 8. Suggested Delivery Sequence
1. **Sprint 1:** SBP-ENG-01, SBP-ENG-02, SBP-ENG-07.
2. **Sprint 2:** SBP-ENG-04, SBP-ENG-08, SBP-ENG-06.
3. **Sprint 3+:** SBP-ENG-03 and SBP-ENG-05 (larger protocol/security changes).

## 9. Exit Criteria for Closing This Audit
1. All P0 tickets completed and deployed.
2. Backfill path available and executed for previously affected agents.
3. Monitoring proves no unresolved vault/metadata divergence beyond SLA.
4. Signed attestations enforce nonce/deadline and canonical score linkage.
5. Runbooks and tooling updated, tested, and used in one successful dry-run + one production run.

