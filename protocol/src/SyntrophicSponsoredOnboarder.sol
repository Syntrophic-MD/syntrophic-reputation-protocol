// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";
import {SRPVault} from "./SRPVault.sol";

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

contract SyntrophicSponsoredOnboarder is IERC721Receiver {
    error ZeroAddress();
    error InvalidBeneficiary();
    error InsufficientBondAmount();
    error RefundFailed();

    event SponsoredOnboarded(
        uint256 indexed agentId,
        address indexed beneficiary,
        address indexed sponsor,
        uint256 bondAmount,
        string agentURI,
        bytes32 paymentRef
    );

    SRPVault public immutable vault;
    IERC8004Registry public immutable registry;

    constructor(SRPVault vault_, IERC8004Registry registry_) {
        if (address(vault_) == address(0) || address(registry_) == address(0)) {
            revert ZeroAddress();
        }
        vault = vault_;
        registry = registry_;
    }

    /// @notice Register an ERC-8004 agent and bond with SRP on behalf of a beneficiary.
    /// @param beneficiary Final owner of the ERC-8004 NFT and the recorded SRP staker.
    /// @param agentURI IPFS URI for the agent's ERC-8004 registration file.
    /// @param paymentRef Backend quote/payment reference for audit correlation.
    /// @return agentId The newly registered agent's token ID.
    function onboardFor(address beneficiary, string calldata agentURI, bytes32 paymentRef)
        external
        payable
        returns (uint256 agentId)
    {
        if (beneficiary == address(0)) {
            revert InvalidBeneficiary();
        }

        uint256 bondAmount = vault.BOND_AMOUNT();
        if (msg.value < bondAmount) {
            revert InsufficientBondAmount();
        }

        // 1. Register — mints NFT to this contract.
        agentId = registry.register(agentURI);

        // 2. Approve the live adapter so it can write syntrophic.* metadata during bond.
        registry.approve(address(vault.registryAdapter()), agentId);

        // 3. Bond — this contract is owner, staker is set to the beneficiary.
        vault.bondFor{value: bondAmount}(agentId, beneficiary);

        // 4. Transfer NFT ownership to the beneficiary.
        registry.transferFrom(address(this), beneficiary, agentId);

        // 5. Refund any excess ETH to the sponsor.
        uint256 excess = msg.value - bondAmount;
        if (excess > 0) {
            (bool sent,) = payable(msg.sender).call{value: excess}("");
            if (!sent) revert RefundFailed();
        }

        emit SponsoredOnboarded(agentId, beneficiary, msg.sender, bondAmount, agentURI, paymentRef);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
