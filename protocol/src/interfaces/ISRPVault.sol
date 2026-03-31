// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

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

    function BOND_AMOUNT() external view returns (uint256);
    function isBonded(uint256 agentId) external view returns (bool);
    function getBondStatus(uint256 agentId) external view returns (BondStatus memory);
}
