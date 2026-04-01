# Syntrophic Sponsored Onboarding MVP
## Contract Specification

**Date:** 2026-03-31  
**Status:** Draft for implementation  
**Depends on:** [MVP_Sponsored_Onboarding_PRD.md](MVP_Sponsored_Onboarding_PRD.md)

---

## 1. Problem To Solve

The current contract path is optimized for direct caller funding, not sponsored execution:

- [SyntrophicOnboarder.sol](/Users/agentbook/code/syntrophic-reputation-protocol/protocol/src/SyntrophicOnboarder.sol#L28) assumes the caller is both initiator and final owner/staker path.
- [SRPVault.sol](/Users/agentbook/code/syntrophic-reputation-protocol/protocol/src/SRPVault.sol#L162) supports `bondFor`, but [SRPVault.sol](/Users/agentbook/code/syntrophic-reputation-protocol/protocol/src/SRPVault.sol#L184) still requires the caller to own the ERC-8004 NFT at execution time.

That makes direct x402-funded sponsorship awkward for user-owned agents.

The MVP contract change should solve this for **new agents only**.

---

## 2. New Contract

### Name

`SyntrophicSponsoredOnboarder`

### Purpose

Register a new ERC-8004 agent, immediately bond it in SRP with ETH supplied by the sponsor, and transfer the ERC-8004 NFT to the beneficiary wallet in the same transaction.

### High-Level Behavior

1. Contract receives ETH from the sponsor.
2. Contract registers a new ERC-8004 agent.
3. Contract calls `vault.bondFor(agentId, beneficiary)` with the exact bond amount.
4. Contract transfers the ERC-8004 NFT to `beneficiary`.
5. Contract refunds any excess ETH to the sponsor.
6. Contract emits a proof-rich event.

---

## 3. Proposed Interface

```solidity
function onboardFor(
    address beneficiary,
    string calldata agentURI,
    bytes32 paymentRef
) external payable returns (uint256 agentId);
```

### Parameters

- `beneficiary`: final owner of the ERC-8004 NFT and final bonded staker identity
- `agentURI`: IPFS URI of the ERC-8004 registration file
- `paymentRef`: stable backend payment/job reference for audit correlation

### Return Value

- `agentId`: newly minted ERC-8004 token ID

---

## 4. Proposed Event

```solidity
event SponsoredOnboarded(
    uint256 indexed agentId,
    address indexed beneficiary,
    address indexed sponsor,
    uint256 bondAmount,
    string agentURI,
    bytes32 paymentRef
);
```

This event is required because the backend needs a deterministic way to join:
- payment settlement,
- job execution,
- tx hash,
- resulting agent ID.

---

## 5. Proposed Errors

```solidity
error ZeroAddress();
error InvalidBeneficiary();
error InsufficientBondAmount();
error RefundFailed();
```

Optional additional errors:

```solidity
error EmptyAgentURI();
error InvalidPaymentRef();
```

---

## 6. Reference Execution Logic

```solidity
function onboardFor(
    address beneficiary,
    string calldata agentURI,
    bytes32 paymentRef
) external payable returns (uint256 agentId) {
    uint256 bondAmount = vault.BOND_AMOUNT();
    if (beneficiary == address(0)) revert InvalidBeneficiary();
    if (msg.value < bondAmount) revert InsufficientBondAmount();

    agentId = registry.register(agentURI);
    vault.bondFor{value: bondAmount}(agentId, beneficiary);
    registry.transferFrom(address(this), beneficiary, agentId);

    uint256 excess = msg.value - bondAmount;
    if (excess > 0) {
        (bool sent,) = payable(msg.sender).call{value: excess}("");
        if (!sent) revert RefundFailed();
    }

    emit SponsoredOnboarded(agentId, beneficiary, msg.sender, bondAmount, agentURI, paymentRef);
}
```

---

## 7. Invariants

- Contract must never retain the ERC-8004 NFT after successful completion.
- Bond amount sent to the vault must equal `vault.BOND_AMOUNT()`.
- Final `BondInfo.staker` must be the beneficiary wallet.
- Final ERC-8004 owner must be the beneficiary wallet.
- If any step fails, the entire transaction must revert.

---

## 8. Security Notes

- Refund path must use the standard checked low-level call pattern.
- No backend key custody is introduced by this contract.
- The sponsor wallet is operational treasury only; it should not become the final ERC-8004 owner.
- `paymentRef` is for auditability only and must not be treated as authorization.

---

## 9. Tests Required

### Happy Path

- registers, bonds, transfers ownership, and emits `SponsoredOnboarded`
- beneficiary becomes ERC-8004 owner
- beneficiary is recorded as SRP staker

### Failure Cases

- reverts on zero beneficiary
- reverts on insufficient `msg.value`
- reverts if registry registration fails
- reverts if vault bonding fails
- reverts if ownership transfer fails
- reverts if excess refund fails

### Behavioral Checks

- excess ETH is refunded to sponsor
- exact bond amount is retained in vault state
- adapter metadata sync still occurs on successful bond path

---

## 10. Deployment Notes

- This should be deployed as a new Base mainnet contract, not retrofitted into the existing onboarder.
- Existing `SyntrophicOnboarder` can remain for direct user-funded flows.
- The sponsor-aware onboarder should be treated as the API/backend entrypoint for the x402 onboarding MVP.

---

## 11. Deferred Contract Work

### Existing-Agent Sponsored Bonding

This is **not** solved by the new onboarder.

To support already-registered agents later, SRP likely needs a new authorization path such as:

```solidity
function bondWithAuth(
    uint256 agentId,
    address beneficiary,
    uint64 deadline,
    uint64 nonce,
    bytes calldata ownerSignature
) external payable;
```

That later flow should let a sponsor fund the bond while the current ERC-8004 owner authorizes the action by signature.

### Multi-Chain Support

No contract-level change is required for the product concept beyond per-chain deployment and configuration.
The multi-chain launch model should be handled at the orchestration layer with one parent payment/job and multiple child chain executions.
