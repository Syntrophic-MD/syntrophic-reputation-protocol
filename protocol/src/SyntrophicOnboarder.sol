// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";
import {SRPVault} from "./SRPVault.sol";

contract SyntrophicOnboarder {
    error ZeroAddress();
    error InsufficientBondAmount();
    error RefundFailed();

    event AgentOnboarded(uint256 indexed agentId, address indexed owner, uint256 bondAmount);

    SRPVault public immutable vault;
    IERC8004Registry public immutable registry;

    constructor(SRPVault vault_, IERC8004Registry registry_) {
        if (address(vault_) == address(0) || address(registry_) == address(0)) {
            revert ZeroAddress();
        }
        vault = vault_;
        registry = registry_;
    }

    /// @notice Register an ERC-8004 agent and bond with SRP atomically.
    /// @param agentURI IPFS URI for the agent's ERC-8004 registration file.
    /// @return agentId The newly registered agent's token ID.
    function onboard(string calldata agentURI) external payable returns (uint256 agentId) {
        uint256 bondAmount = vault.BOND_AMOUNT();
        if (msg.value < bondAmount) {
            revert InsufficientBondAmount();
        }

        // 1. Register — mints NFT to this contract
        agentId = registry.register(agentURI);

        // 2. Bond — this contract is owner, staker is set to the actual caller
        vault.bondFor{value: bondAmount}(agentId, msg.sender);

        // 3. Transfer NFT ownership to the caller
        registry.transferFrom(address(this), msg.sender, agentId);

        // 4. Refund excess ETH
        uint256 excess = msg.value - bondAmount;
        if (excess > 0) {
            (bool sent,) = payable(msg.sender).call{value: excess}("");
            if (!sent) revert RefundFailed();
        }

        emit AgentOnboarded(agentId, msg.sender, bondAmount);
    }
}
