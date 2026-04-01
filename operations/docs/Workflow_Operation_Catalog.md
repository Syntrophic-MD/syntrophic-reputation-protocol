# Workflow Operation Catalog

This catalog maps current scripts to future API, MCP, and CLI surfaces.

## Conventions

- Write operations should support `dry_run` and `idempotency_key`.
- Each operation returns an `operation_id` and `job_id` for traceability.
- Output artifacts should be persisted in a structured runtime log path.

## Operations

| Operation ID | Current Script / Source | Inputs | Outputs | Side Effects | Future API | Future MCP Tool | Future CLI |
|---|---|---|---|---|---|---|---|
| `profile.validate` | new shared validator for sponsored onboarding | profile JSON, target chain list | normalized payload, validation errors | none | `POST /v1/profiles:validate` | `profile_validate` | `syntrophic profile validate` |
| `profile.generate_assets` | `scripts/generate_syntrophic_profile_assets.py` and `scripts/generate_syntrophic_profile_assets_v2.py` | profile definition JSON, prompt/style options | image files, metadata JSON | local file writes | `POST /v1/profiles/assets:generate` | `profile_generate_assets` | `syntrophic profile generate-assets` |
| `profile.publish_ipfs` | `scripts/upload_profiles_to_pinata.sh` | metadata + image paths, pin provider creds | IPFS CIDs, manifest | metadata mutation + pin operations | `POST /v1/profiles/ipfs:publish` | `profile_publish_ipfs` | `syntrophic profile publish-ipfs` |
| `onboarding.quote` | new sponsored onboarding quote service | beneficiary, profile payload, chain list | quote ID, expiry, price breakdown | quote persistence | `POST /v1/onboarding/quotes` | `onboarding_quote` | `syntrophic onboarding quote` |
| `onboarding.launch_sponsored` | new job runner using sponsor-funded Base execution | quote ID, beneficiary, profile payload | job handle, proof bundle | payment verification, IPFS pin, on-chain onboard tx | `POST /v1/onboarding/launches` | `syntrophic_launch_bonded_agent` | `syntrophic onboarding launch-bonded-agent` |
| `onboarding.get_status` | new job store and verifier | job ID | status, result, proof bundle | none (read-only) | `GET /v1/jobs/{job_id}` | `onboarding_get_status` | `syntrophic onboarding status` |
| `registry.onboard_sponsored` | new `SyntrophicSponsoredOnboarder` contract path | beneficiary, agent URI, payment ref | tx hash, agent ID | ERC-8004 registration + SRP bond + transfer | internal executor | internal | internal |
| `registry.register_batch` | `scripts/erc8004_batch_register.sh` | wallet count/list, fund amount, register mode, URI source | agent IDs, tx hashes, summary CSV/JSON | wallet creation, funding txs, register txs | `POST /v1/registry/agents:batch-register` | `registry_register_batch` | `syntrophic registry register-batch` |
| `registry.set_agent_uri` | used in `scripts/erc8004_batch_register.sh` and `scripts/erc8004_fix_https_images.sh` | agent ID, new URI, signer key | tx hash, updated URI | on-chain metadata URI update | `POST /v1/registry/agents/{agent_id}:set-uri` | `registry_set_agent_uri` | `syntrophic registry set-uri` |
| `profile.fix_image_https` | `scripts/erc8004_fix_https_images.sh` | agent IDs, gateway base, gas settings | updated metadata URIs, report JSON | IPFS republish + on-chain URI update | `POST /v1/profiles/images:https-fix` | `profile_fix_image_https` | `syntrophic profile fix-image-https` |
| `sbp.bond_batch` | `scripts/sbp_batch_bond.sh` | agent IDs, wallet map, gas settings | bond report JSON, summary CSV | SBP bond txs, optional top-ups | `POST /v1/sbp/bonds:batch-create` | `sbp_bond_batch` | `syntrophic sbp bond-batch` |
| `sbp.verify_status` | `cast call` checks in scripts/runbooks | agent IDs | bonded flags, metadata status | none (read-only) | `GET /v1/sbp/agents/{agent_id}/status` | `sbp_verify_status` | `syntrophic sbp status` |
| `sbp.bond_existing_sponsored` | future vault authorization path for existing agents | agent ID, owner intent, quote/payment info | tx hash, bonded status | sponsored bond write for already-registered agent | future | `syntrophic_bond_existing_agent` | future |
| `feedback.submit` | currently manual flow using ERC-8004 feedback route | from agent, to agent, score/payload | feedback tx hash | on-chain feedback write | `POST /v1/feedback` | `feedback_submit` | `syntrophic feedback submit` |
| `feedback.verify_effect` | currently manual checks via scanner + metadata | target agent IDs | aggregate feedback + SBP-compatible score/review status | none (read-only) | `GET /v1/feedback/agents/{agent_id}/effect` | `feedback_verify_effect` | `syntrophic feedback verify-effect` |

## Gaps To Close Before Productization

- Dedicated feedback wrapper for SBP-compatible scoring semantics.
- Explicit atomicity mode for bond + metadata propagation where possible.
- Structured operation logs outside ad-hoc timestamp folders.
- Unified validation layer for profile metadata before publish/register.
- Parent/child job model for future single-payment multi-chain launches.
