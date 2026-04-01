# SBP Bonding vs ERC-8004 Metadata Incident (2026-03-23)

## Factual Record (No Opinion)

1. Objective executed from `https://syntrophic.md/skill.md`: bond agents on Base mainnet through SBP Vault and verify onchain state.

2. Contracts used:
- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- SBP Vault: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`
- ERC-8004 Registry Adapter: `0x63DCE10906BB3D3C8280A3fa578594D261C4b804`

3. Bonding execution outcome:
- `#222` (`agentId=32055`) was already bonded before this run.
- New bond txs succeeded for:
  - `#223` (`36105`): `0xc326d4a7ac263ac3cfba228f19199bac26b8df86a20861ba0be0fc31cdc9cdd4`
  - `#224` (`36109`): `0xb06f8c916ffd0ac8e7577bff8e526f2fc60486b1f542801bd12e4599305e1185`
  - `#225` (`36110`): `0xd0c763ecf468982c96ddeaba0a35064fd9dfc6f32154bc19720560edc099f5a9`
- Bond verification at time of report: `isBonded=true` for `36105/36109/36110`.

4. Metadata mismatch observed:
- ERC-8004 metadata key `syntrophic.status` remained `0x` for `36105/36109/36110`.
- At that same point, adapter authorization for those three agent IDs was `false`.

5. Contract behavior causing this result:
- Vault calls adapter during bond (`onBond`) in [SBPVault/Contract.sol:219](/Users/agentbook/code/agent-onboarding/.secrets/abi_fetch/0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248/SBPVault/Contract.sol:219).
- Adapter checks `canWrite(agentId)` and, if unauthorized, emits `MetadataSyncSkipped` and returns without revert in [ERC8004RegistryAdapter/Contract.sol:106](/Users/agentbook/code/agent-onboarding/.secrets/abi_fetch/0x63DCE10906BB3D3C8280A3fa578594D261C4b804/ERC8004RegistryAdapter/Contract.sol:106).
- Therefore, bond state can succeed while metadata remains unchanged.

6. Authorization remediation executed:
- Sent `setApprovalForAll(adapter,true)` from each owner wallet:
  - `36105`: `0xd31e711fffe82f3fb1e75dcc235854ea690d5c8b4b57d31817fa117e13cbc250`
  - `36109`: `0x174ba9978ae011dcc40fdd70f09b3e59799cb9238ba2161ea6be57e46cf08f8d`
  - `36110`: `0xed02e45c152b5c3edc13a5e466f2044f8bc43522d626abcbeb19c97cba67e733`
- Current checks after remediation:
  - `isApprovedForAll(owner, adapter)=true`
  - `isAuthorizedOrOwner(adapter, agentId)=true`
  - `syntrophic.status` still `0x`

7. Why metadata did not backfill after approvals:
- Deployed adapter only writes on lifecycle callbacks (`onBond`, `onSlash`, `onWithdraw`).
- No post-hoc public replay/sync function is exposed to retroactively write metadata for already-bonded agents.

8. Follow-up action started (option 2: unbond then rebond):
- `requestUnstake` txs submitted for `36105/36109/36110`:
  - `0x25793e2ddb3a2587da703cf7c64424e1b6837ffe035871626b4374eb84f9f7fc`
  - `0xc019db1ec4ec50310f60db77ebb1cdbe773e696512c3fefd9e4fda0f9f9430f2`
  - `0x10edafecdedadd84e129c03844a7872affa0e5b5d67fa8a9829f109f62507e86`
- Current unlock blocks:
  - `36105`: `43761443`
  - `36109`: `43761445`
  - `36110`: `43761446`
- `withdraw` is blocked until unlock (`ChallengeWindowActive`), then rebond can be executed to trigger adapter sync again.

## UX Opinion (What Could Be Better)

1. Skill/runbook should include a mandatory preflight gate:
- Check adapter authorization before bonding.
- If not authorized, instruct either:
  - authorize first, then bond, or
  - proceed in bond-only mode with explicit warning that metadata may remain empty.

2. The flow should expose two explicit user choices up front:
- `Bond only (vault state only)`
- `Bond + metadata sync (requires adapter authorization)`

3. Protocol-level improvement:
- Add an explicit backfill function (example: `syncBondMetadata(agentId)`) callable after authorization, so users do not need unbond/rebond just to populate metadata.

4. Alternative strict mode:
- Optionally make bond revert when adapter cannot write metadata, if the chosen mode is `atomic`.

5. Explorer/UI improvement:
- Show both states separately:
  - SBP vault truth: `isBonded`
  - ERC-8004 metadata projection: `syntrophic.status`
- This avoids confusion when one is updated and the other is not.
