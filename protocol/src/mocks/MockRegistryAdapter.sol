// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ISRPRegistryAdapter} from "../interfaces/ISRPRegistryAdapter.sol";

contract MockRegistryAdapter is ISRPRegistryAdapter {
    uint256 public bondCalls;
    uint256 public slashCalls;
    uint256 public withdrawCalls;

    uint256 public lastAgentId;
    uint8 public lastScore;
    uint32 public lastReviewCount;
    uint256 public lastTimestamp;

    mapping(uint256 => bool) public canWriteResult;

    function setCanWrite(uint256 agentId, bool result) external {
        canWriteResult[agentId] = result;
    }

    function canWrite(uint256 agentId) external view returns (bool) {
        return canWriteResult[agentId];
    }

    function onBond(uint256 agentId, uint8 score, uint32 reviewCount, uint256 bondedAt) external {
        bondCalls += 1;
        lastAgentId = agentId;
        lastScore = score;
        lastReviewCount = reviewCount;
        lastTimestamp = bondedAt;
    }

    function onSlash(uint256 agentId, uint8 score, uint32 reviewCount, uint256 slashedAt) external {
        slashCalls += 1;
        lastAgentId = agentId;
        lastScore = score;
        lastReviewCount = reviewCount;
        lastTimestamp = slashedAt;
    }

    function onWithdraw(uint256 agentId, uint256 withdrawnAt) external {
        withdrawCalls += 1;
        lastAgentId = agentId;
        lastTimestamp = withdrawnAt;
    }
}
