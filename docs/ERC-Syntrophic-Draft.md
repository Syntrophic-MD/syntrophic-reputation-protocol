---
eip: XXXX
title: Syntrophic Reputation Protocol for AI Agent Trust
description: ERC-8004-compatible reputation staking for verifiable AI agent trust
author: Syntrophic Agent #222
discussions-to: https://ethereum-magicians.org/t/erc-xxxx-syntrophic-reputation-protocol-for-decentralized-agents/xxxxx
status: Draft
type: Standards Track
category: ERC
created: 2026-03-21
requires: 8004, 712
license: CC0-1.0
---

## Simple Summary

Syntrophic Reputation Protocol lets an ERC-8004 agent owner stake reputation from day zero by locking ETH as a public performance bond, updating trust state through signed ROFL attestations, and publishing interoperable `syntrophic.*` metadata so any app can verify bonded/slashed/withdrawn status on-chain.

## Abstract

The Syntrophic Reputation Protocol (SRP) defines a trust-minimizing bond layer for ERC-8004 agents. It addresses the day-zero trust gap, where capable new agents cannot participate in high-trust interactions because they have no prior reputation history. An agent owner stakes a fixed ETH bond against an ERC-8004 `agentId`, receives a verifiable bonded status, and becomes slashable by signed attestations from a designated ROFL signer. SRP standardizes the vault lifecycle (bond, score update, unstake, withdraw, slash) and an ERC-8004 metadata bridge (`syntrophic.*` keys) so humans and agents can verify trust state directly on-chain and reuse it across applications.

## Motivation

As agent participation grows across social and communication systems, trust quality degrades without shared verification primitives. SRP is motivated by four concrete failures:

1. **Day-zero trust deadlock**: agents need reputation to gain opportunities, but need opportunities to build reputation.
2. **Signal-to-noise collapse**: low-cost identity rotation allows spam and impersonation to overwhelm useful agent activity.
3. **Platform lock-in**: centralized badges are non-portable and can be arbitrarily revoked.
4. **Unaccountable influence**: actors can affect trust outcomes without posting economic collateral.

SRP introduces portable economic accountability for ERC-8004 identities by attaching stake directly to `agentId` ownership and making slash/withdraw/cooldown transitions explicit on-chain.

### Design Goals

SRP is designed to provide primitives for decentralized social coordination where humans and agents can collaborate with less noise and stronger accountability. Implementations SHOULD optimize for:

1. **Day-zero trust signaling**: agents can pre-commit stake before reputation history exists.
2. **Cross-application portability**: trust state can be reused across inboxes, feeds, marketplaces, and agent-to-agent channels.
3. **Transparent enforcement**: critical state transitions are auditable and machine-verifiable.
4. **Composable integration**: downstream protocols can consume SRP state without requiring custom trust backends.

SRP does not standardize one universal off-chain scoring algorithm or one user interface; it standardizes the on-chain trust and accountability surface.

## Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119 and RFC 8174.

### Terminology

- `agentId`: ERC-8004 token ID (`uint256`).
- `staker`: The address currently funding an active bond for an `agentId`.
- `roflSigner`: Trusted signer address whose EIP-712 signatures authorize score/slash attestations.
- `registryAdapter`: Contract that writes SRP state into ERC-8004 metadata keys.

### Required Vault Interface

Implementations MUST expose equivalent behavior to the following interface:

```solidity
interface ISRPVault {
    struct BondStatus {
        bool isBonded;
        address staker;
        uint256 bondAmount;
        uint256 bondedAt;
        uint256 score;
        uint256 reviewCount;
        uint256 unlockBlock;
        uint256 stakeId;
        uint256 cooldownEndsAt;
    }

    struct ScoreAttestation {
        uint256 agentId;
        uint8 score;
        uint32 reviewCount;
        uint64 nonce;
        uint64 deadline;
    }

    struct SlashAttestation {
        uint256 agentId;
        uint8 score;
        uint64 stakeId;
        uint64 nonce;
        uint64 deadline;
        bytes32 evidenceHash;
    }

    event AgentBonded(
        uint256 indexed agentId,
        uint256 indexed stakeId,
        address indexed staker,
        uint256 amount,
        uint256 timestamp
    );
    event ScoreUpdated(uint256 indexed agentId, uint8 score, uint32 reviewCount, uint64 nonce, uint256 timestamp);
    event UnstakeRequested(uint256 indexed agentId, uint256 unlockBlock, uint8 score, uint32 reviewCount);
    event BondWithdrawn(uint256 indexed agentId, address indexed staker, uint256 amount, uint256 timestamp);
    event SlashExecuted(
        uint256 indexed agentId,
        uint256 indexed stakeId,
        address indexed staker,
        uint256 amount,
        uint8 score,
        uint256 cooldownEndsAt,
        bytes32 attestationDigest
    );

    function BOND_AMOUNT() external view returns (uint256);
    function MAX_SCORE() external view returns (uint8);
    function SLASH_THRESHOLD() external view returns (uint8);
    function STANDARD_WINDOW_BLOCKS() external view returns (uint256);
    function NEW_USER_WINDOW_BLOCKS() external view returns (uint256);
    function COOLDOWN_SECONDS() external view returns (uint256);

    function bond(uint256 agentId) external payable;
    function updateScore(ScoreAttestation calldata attestation, bytes calldata signature) external;
    function requestUnstake(uint256 agentId) external;
    function executeSlash(SlashAttestation calldata attestation, bytes calldata signature) external;
    function withdraw(uint256 agentId) external;

    function getBondStatus(uint256 agentId) external view returns (BondStatus memory);
    function isBonded(uint256 agentId) external view returns (bool);
    function cooldownUntil(uint256 agentId) external view returns (uint256);

    function hashScoreAttestation(ScoreAttestation calldata attestation) external view returns (bytes32);
    function hashSlashAttestation(SlashAttestation calldata attestation) external view returns (bytes32);
}
```

### Vault State-Transition Requirements

#### `bond(uint256 agentId)`

An implementation MUST:

1. Require `msg.value == BOND_AMOUNT()`.
2. Require `msg.sender == IERC8004Registry.ownerOf(agentId)`.
3. Reject if `agentId` already has an active bond.
4. Reject if `block.timestamp < cooldownUntil(agentId)`.
5. Initialize active bond state with `score = MAX_SCORE()` and `reviewCount = 0`.
6. Emit `AgentBonded`.

#### `updateScore(ScoreAttestation, signature)`

An implementation MUST:

1. Require `attestation.score <= MAX_SCORE()`.
2. Require `block.timestamp <= attestation.deadline`.
3. Require active bond for `attestation.agentId`.
4. Require strictly increasing score nonce per `agentId`.
5. Verify EIP-712 signature from `roflSigner`.
6. Update `score` and `reviewCount`.
7. Emit `ScoreUpdated`.

#### `requestUnstake(uint256 agentId)`

An implementation MUST:

1. Require active bond.
2. Require `msg.sender == staker`.
3. Set `unlockBlock = block.number + challengeWindowBlocks(score, reviewCount)`.
4. Emit `UnstakeRequested`.

#### `withdraw(uint256 agentId)`

An implementation MUST:

1. Require active bond.
2. Require `msg.sender == staker`.
3. Require `unlockBlock != 0`.
4. Require `block.number >= unlockBlock`.
5. Delete active bond.
6. Transfer full bond amount to staker.
7. Emit `BondWithdrawn`.

#### `executeSlash(SlashAttestation, signature)`

An implementation MUST:

1. Require `attestation.score < SLASH_THRESHOLD()`.
2. Require `block.timestamp <= attestation.deadline`.
3. Require slash nonce unused for `agentId`.
4. Require active bond and `attestation.stakeId == currentStakeId`.
5. Verify EIP-712 signature from `roflSigner`.
6. Mark slash nonce used.
7. Delete active bond.
8. Set `cooldownUntil(agentId) = block.timestamp + COOLDOWN_SECONDS()`.
9. Transfer full bond amount to `communityRewards`.
10. Emit `SlashExecuted`.

### Challenge Window Function

`challengeWindowBlocks(score, reviewCount)` MUST follow:

- return `0` if `score > 80 && reviewCount > 10`
- return `NEW_USER_WINDOW_BLOCKS()` if `reviewCount < 3`
- otherwise return `STANDARD_WINDOW_BLOCKS()`

### EIP-712 Attestation Domain and Type Hashes

Implementations SHOULD use:

- Domain name: `SyntrophicReputationProtocol`
- Domain version: `1`
- Domain fields: `name`, `version`, `chainId`, `verifyingContract`

Type strings:

```text
ScoreAttestation(uint256 agentId,uint8 score,uint32 reviewCount,uint64 nonce,uint64 deadline)
SlashAttestation(uint256 agentId,uint8 score,uint64 stakeId,uint64 nonce,uint64 deadline,bytes32 evidenceHash)
```

### Score Policy Scope

This standard specifies how scores are authenticated and applied on-chain, but does not mandate one universal off-chain scoring algorithm. ROFL logic, review weighting, and evidence generation are implementation-specific, provided resulting attestations follow the EIP-712 formats above.

### ERC-8004 Metadata Bridge

SRP metadata SHOULD be written through a dedicated adapter contract called by the vault on lifecycle hooks.

Adapter hook interface:

```solidity
interface ISRPRegistryAdapter {
    function onBond(uint256 agentId, uint8 score, uint32 reviewCount, uint256 bondedAt) external;
    function onSlash(uint256 agentId, uint8 score, uint32 reviewCount, uint256 slashedAt) external;
    function onWithdraw(uint256 agentId, uint256 withdrawnAt) external;
}
```

Metadata keys and canonical encoding:

1. `syntrophic.validator`: `abi.encode(address vaultAddress)`
2. `syntrophic.status`: raw bytes of ASCII string (`BONDED`, `SLASHED`, `WITHDRAWN`)
3. `syntrophic.score`: `abi.encode(uint8 score)`
4. `syntrophic.reviewCount`: `abi.encode(uint32 reviewCount)`
5. `syntrophic.updatedAt`: `abi.encode(uint256 unixTimestamp)`

Metadata synchronization triggers in the reference implementation are `onBond`, `onSlash`, and `onWithdraw`. Implementations MAY additionally sync on score updates.

#### Adapter Authorization Requirement

Before metadata writes can succeed, ERC-8004 authorization MUST allow adapter writes for the target `agentId`, typically such that:

```solidity
IERC8004Registry.isAuthorizedOrOwner(adapter, agentId) == true
```

Implementations SHOULD fail open on metadata sync (skip and emit a diagnostic event) rather than reverting vault state transitions.

### Protocol Parameters

This specification does not mandate one global bond value across deployments. A deployment MUST expose a fixed `BOND_AMOUNT()` for that vault instance.

Reference SRP mainnet deployment (hackathon profile) uses:

- `BOND_AMOUNT = 0.00001 ether`
- `SLASH_THRESHOLD = 51`
- `COOLDOWN_SECONDS = 30 days`
- `STANDARD_WINDOW_BLOCKS = 300`
- `NEW_USER_WINDOW_BLOCKS = 1800`

## Rationale

### `uint256 agentId` Instead of Address

ERC-8004 identity is keyed by token ID, not wallet address. Using `uint256 agentId` in vault APIs avoids ambiguity and aligns directly with `ownerOf(agentId)` semantics.

### Metadata as `bytes`

ERC-8004 metadata values are bytes. The SRP key-value schema allows compact, typed encoding while remaining forward-compatible and indexer-friendly.

### Full-Bond Slashing

A full slash penalty gives a clear binary trust signal and simplifies downstream interpretation (`bonded` vs `not bonded` + cooldown).

## Backwards Compatibility

SRP is opt-in and ERC-8004-compatible:

- Existing ERC-8004 agents continue unchanged until bonded.
- Non-participating agents are unaffected.
- SRP metadata keys are namespaced under `syntrophic.*`.

## Security Considerations

1. **Signer key management**: `roflSigner` compromise can approve malicious score/slash attestations. Production deployments SHOULD rotate keys via governance-capable vault designs.
2. **Attestation replay**: Slash uses nonce-consumption (`usedSlashNonce`) and score uses strictly increasing nonce to prevent replay.
3. **Authorization drift**: Metadata sync depends on ERC-8004 authorization. Integrators MUST monitor adapter authorization and not assume metadata writes always succeed.
4. **Withdrawal race conditions**: Challenge windows are block-based; observers SHOULD monitor `UnstakeRequested` to submit slash evidence before `unlockBlock`.
5. **Transfer safety**: Vault implementations MUST use non-reentrancy protection for slash/withdraw value transfers.

## Test Cases (Minimum)

1. Bond succeeds only for ERC-8004 owner with exact bond amount.
2. Non-owner bond attempts revert.
3. Unknown agent IDs revert through ERC-8004 `ownerOf`.
4. High-trust unstake path yields zero-block unlock.
5. Standard and new-user challenge windows follow the normative function.
6. Slash with valid attestation transfers full bond and starts cooldown.
7. Rebond during cooldown reverts; rebond after cooldown succeeds.
8. Only staker can request unstake and withdraw.
9. Adapter writes `syntrophic.*` keys when authorized; emits skip signal when unauthorized.

## Reference Implementation

Current reference implementation is available in this repository:

- Vault: `protocol/src/SRPVault.sol`
- Adapter: `protocol/src/adapters/ERC8004RegistryAdapter.sol`
- Tests: `protocol/test/SRPVault.t.sol`, `protocol/test/ERC8004RegistryAdapter.t.sol`

## Deployment and Verification (Informative)

Live Base mainnet verification artifacts and transaction links are documented in:

- `docs/SRP_Base_Mainnet_Demo_Report.md`

Reference addresses for the live deployment described there:

- ERC-8004 Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ERC8004RegistryAdapter: `0x63DCE10906BB3D3C8280A3fa578594D261C4b804`
- SRPVault: `0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248`

This report includes:

1. Deployment transaction hashes.
2. First live `bond(32055)` transaction.
3. ERC-8004 metadata backfill transactions.
4. UI and CLI instructions to verify all on-chain state.

## Data Interpretation Guide (Informative)

Examples for decoding `getMetadata(32055, key)` responses:

- `syntrophic.status = 0x424f4e444544` -> `BONDED`
- `syntrophic.score = 0x...64` -> `100`
- `syntrophic.reviewCount = 0x...00` -> `0`
- `syntrophic.updatedAt = 0x...69c0a6d7` -> unix `1774233303`
- `syntrophic.validator = 0x000...<20-byte vault>` -> parse as address

## Copyright

Copyright and related rights waived via CC0.
