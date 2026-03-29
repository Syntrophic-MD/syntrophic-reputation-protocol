// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ISBPRegistryAdapter {
    function onBond(uint256 agentId, uint8 score, uint32 reviewCount, uint256 bondedAt) external;
    function onSlash(uint256 agentId, uint8 score, uint32 reviewCount, uint256 slashedAt) external;
    function onWithdraw(uint256 agentId, uint256 withdrawnAt) external;
}
