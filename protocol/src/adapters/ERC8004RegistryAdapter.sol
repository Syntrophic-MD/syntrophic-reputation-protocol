// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ISRPRegistryAdapter} from "../interfaces/ISRPRegistryAdapter.sol";
import {IERC8004Registry} from "../interfaces/IERC8004Registry.sol";
import {ISRPVault} from "../interfaces/ISRPVault.sol";

contract ERC8004RegistryAdapter is ISRPRegistryAdapter {
    error ZeroAddress();
    error NotOwner();
    error NotVault();
    error VaultAlreadySet();
    error AgentNotBonded(uint256 agentId);

    event MetadataSyncSkipped(uint256 indexed agentId, string reason);
    event MetadataSynced(uint256 indexed agentId, string status, uint8 score, uint32 reviewCount);

    string public constant KEY_VALIDATOR = "syntrophic.validator";
    string public constant KEY_STATUS = "syntrophic.status";
    string public constant KEY_SCORE = "syntrophic.score";
    string public constant KEY_REVIEW_COUNT = "syntrophic.reviewCount";
    string public constant KEY_UPDATED_AT = "syntrophic.updatedAt";

    IERC8004Registry public immutable registry;
    address public owner;
    address public vault;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier onlyVault() {
        if (msg.sender != vault) {
            revert NotVault();
        }
        _;
    }

    constructor(IERC8004Registry registry_) {
        if (address(registry_) == address(0)) {
            revert ZeroAddress();
        }

        registry = registry_;
        owner = msg.sender;
    }

    function setVault(address vault_) external onlyOwner {
        if (vault_ == address(0)) {
            revert ZeroAddress();
        }
        if (vault != address(0)) {
            revert VaultAlreadySet();
        }
        vault = vault_;
    }

    function onBond(uint256 agentId, uint8 score, uint32 reviewCount, uint256 bondedAt) external onlyVault {
        _sync(agentId, "BONDED", score, reviewCount, bondedAt);
    }

    function onSlash(uint256 agentId, uint8 score, uint32 reviewCount, uint256 slashedAt) external onlyVault {
        _sync(agentId, "SLASHED", score, reviewCount, slashedAt);
    }

    function onWithdraw(uint256 agentId, uint256 withdrawnAt) external onlyVault {
        _sync(agentId, "WITHDRAWN", 0, 0, withdrawnAt);
    }

    function canWrite(uint256 agentId) public view returns (bool) {
        return registry.isAuthorizedOrOwner(address(this), agentId);
    }

    function syncBondMetadata(uint256 agentId) external {
        ISRPVault.BondStatus memory status = ISRPVault(vault).getBondStatus(agentId);
        if (!status.isBonded) {
            revert AgentNotBonded(agentId);
        }
        _sync(agentId, "BONDED", uint8(status.score), uint32(status.reviewCount), status.bondedAt);
    }

    function _sync(uint256 agentId, string memory status, uint8 score, uint32 reviewCount, uint256 timestamp) internal {
        if (!canWrite(agentId)) {
            emit MetadataSyncSkipped(agentId, "adapter-not-authorized");
            return;
        }

        registry.setMetadata(agentId, KEY_VALIDATOR, abi.encode(vault));
        registry.setMetadata(agentId, KEY_STATUS, bytes(status));
        registry.setMetadata(agentId, KEY_SCORE, abi.encode(score));
        registry.setMetadata(agentId, KEY_REVIEW_COUNT, abi.encode(reviewCount));
        registry.setMetadata(agentId, KEY_UPDATED_AT, abi.encode(timestamp));

        emit MetadataSynced(agentId, status, score, reviewCount);
    }
}
