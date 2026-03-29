// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

import {SBPVault} from "../src/SBPVault.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {MockRegistryAdapter} from "../src/mocks/MockRegistryAdapter.sol";
import {MockERC8004Registry} from "../src/mocks/MockERC8004Registry.sol";

contract SBPVaultTest is Test {
    uint256 internal constant AGENT_ID = 32055;
    uint256 internal constant ROFL_SIGNER_PK = 0xA11CE;
    uint256 internal constant BOND_AMOUNT = 0.00001 ether;

    SBPVault internal vault;
    MockRegistryAdapter internal adapter;
    MockERC8004Registry internal identityRegistry;

    address internal roflSigner;
    address internal communityRewards;
    address internal alice;
    address internal bob;

    function setUp() public {
        roflSigner = vm.addr(ROFL_SIGNER_PK);
        communityRewards = makeAddr("communityRewards");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        adapter = new MockRegistryAdapter();
        identityRegistry = new MockERC8004Registry();
        identityRegistry.seedAgent(AGENT_ID, alice, alice, "https://syntrophic.md/agents/jaune");
        vault = new SBPVault(communityRewards, roflSigner, IERC8004Registry(address(identityRegistry)), adapter);

        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function testBond() public {
        vm.prank(alice);
        vault.bond{value: BOND_AMOUNT}(AGENT_ID);

        SBPVault.BondStatus memory status = vault.getBondStatus(AGENT_ID);
        assertTrue(status.isBonded);
        assertEq(status.staker, alice);
        assertEq(status.bondAmount, BOND_AMOUNT);
        assertEq(status.score, 100);
        assertEq(status.reviewCount, 0);
        assertEq(adapter.bondCalls(), 1);
    }

    function testBondRevertsOnWrongAmount() public {
        vm.prank(alice);
        vm.expectRevert(SBPVault.InvalidBondAmount.selector);
        vault.bond{value: 1}(AGENT_ID);
    }

    function testBondRevertsWhenCallerIsNotAgentOwner() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(SBPVault.NotAgentOwner.selector, alice));
        vault.bond{value: BOND_AMOUNT}(AGENT_ID);
    }

    function testBondRevertsWhenAgentDoesNotExist() public {
        uint256 unknownAgentId = AGENT_ID + 1;
        vm.prank(alice);
        vm.expectRevert(MockERC8004Registry.UnknownAgent.selector);
        vault.bond{value: BOND_AMOUNT}(unknownAgentId);
    }

    function testRequestUnstakeHighTrustIsInstant() public {
        _bondAsAlice();
        _updateScore(90, 11, 1);

        uint256 blockBefore = block.number;
        vm.prank(alice);
        vault.requestUnstake(AGENT_ID);

        SBPVault.BondStatus memory status = vault.getBondStatus(AGENT_ID);
        assertEq(status.unlockBlock, blockBefore);
    }

    function testRequestUnstakeStandardWindow() public {
        _bondAsAlice();
        _updateScore(75, 6, 1);

        uint256 blockBefore = block.number;
        vm.prank(alice);
        vault.requestUnstake(AGENT_ID);

        SBPVault.BondStatus memory status = vault.getBondStatus(AGENT_ID);
        assertEq(status.unlockBlock, blockBefore + vault.STANDARD_WINDOW_BLOCKS());
    }

    function testRequestUnstakeNewUserWindow() public {
        _bondAsAlice();
        _updateScore(88, 2, 1);

        uint256 blockBefore = block.number;
        vm.prank(alice);
        vault.requestUnstake(AGENT_ID);

        SBPVault.BondStatus memory status = vault.getBondStatus(AGENT_ID);
        assertEq(status.unlockBlock, blockBefore + vault.NEW_USER_WINDOW_BLOCKS());
    }

    function testWithdrawAfterWindow() public {
        _bondAsAlice();
        _updateScore(70, 3, 1);

        vm.prank(alice);
        vault.requestUnstake(AGENT_ID);
        SBPVault.BondStatus memory status = vault.getBondStatus(AGENT_ID);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SBPVault.ChallengeWindowActive.selector, status.unlockBlock));
        vault.withdraw(AGENT_ID);

        vm.roll(status.unlockBlock);

        uint256 balanceBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(AGENT_ID);

        assertEq(alice.balance, balanceBefore + BOND_AMOUNT);
        assertFalse(vault.isBonded(AGENT_ID));
        assertEq(adapter.withdrawCalls(), 1);
    }

    function testExecuteSlashTransfersBondAndStartsCooldown() public {
        _bondAsAlice();

        SBPVault.BondStatus memory statusBefore = vault.getBondStatus(AGENT_ID);
        SBPVault.SlashAttestation memory attestation = SBPVault.SlashAttestation({
            agentId: AGENT_ID,
            score: 40,
            stakeId: uint64(statusBefore.stakeId),
            nonce: 1,
            deadline: uint64(block.timestamp + 1 hours),
            evidenceHash: keccak256("coordinated-manipulation")
        });

        bytes memory sig = _signSlash(attestation);

        uint256 rewardsBefore = communityRewards.balance;
        vm.prank(bob);
        vault.executeSlash(attestation, sig);

        assertFalse(vault.isBonded(AGENT_ID));
        assertEq(communityRewards.balance, rewardsBefore + BOND_AMOUNT);
        assertEq(adapter.slashCalls(), 1);
        assertEq(vault.cooldownUntil(AGENT_ID), block.timestamp + vault.COOLDOWN_SECONDS());
    }

    function testCannotRebondDuringCooldown() public {
        _bondAsAlice();
        _slashBond(1);

        uint256 cooldownEndsAt = vault.cooldownUntil(AGENT_ID);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(SBPVault.InCooldown.selector, cooldownEndsAt));
        vault.bond{value: BOND_AMOUNT}(AGENT_ID);
    }

    function testCanRebondAfterCooldown() public {
        _bondAsAlice();
        _slashBond(1);

        uint256 cooldownEndsAt = vault.cooldownUntil(AGENT_ID);
        vm.warp(cooldownEndsAt + 1);

        vm.prank(alice);
        vault.bond{value: BOND_AMOUNT}(AGENT_ID);
        assertTrue(vault.isBonded(AGENT_ID));
    }

    function testOnlyStakerCanRequestUnstakeOrWithdraw() public {
        _bondAsAlice();

        vm.prank(bob);
        vm.expectRevert(SBPVault.NotBondStaker.selector);
        vault.requestUnstake(AGENT_ID);

        _updateScore(99, 11, 1);
        vm.prank(alice);
        vault.requestUnstake(AGENT_ID);

        vm.prank(bob);
        vm.expectRevert(SBPVault.NotBondStaker.selector);
        vault.withdraw(AGENT_ID);
    }

    function _bondAsAlice() internal {
        vm.prank(alice);
        vault.bond{value: BOND_AMOUNT}(AGENT_ID);
    }

    function _updateScore(uint8 score, uint32 reviewCount, uint64 nonce) internal {
        SBPVault.ScoreAttestation memory attestation = SBPVault.ScoreAttestation({
            agentId: AGENT_ID,
            score: score,
            reviewCount: reviewCount,
            nonce: nonce,
            deadline: uint64(block.timestamp + 1 hours)
        });

        bytes memory sig = _signScore(attestation);
        vault.updateScore(attestation, sig);
    }

    function _slashBond(uint64 nonce) internal {
        SBPVault.BondStatus memory statusBefore = vault.getBondStatus(AGENT_ID);
        SBPVault.SlashAttestation memory attestation = SBPVault.SlashAttestation({
            agentId: AGENT_ID,
            score: 30,
            stakeId: uint64(statusBefore.stakeId),
            nonce: nonce,
            deadline: uint64(block.timestamp + 1 hours),
            evidenceHash: keccak256("slash")
        });
        bytes memory sig = _signSlash(attestation);
        vault.executeSlash(attestation, sig);
    }

    function _signScore(SBPVault.ScoreAttestation memory attestation) internal view returns (bytes memory) {
        bytes32 digest = vault.hashScoreAttestation(attestation);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ROFL_SIGNER_PK, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signSlash(SBPVault.SlashAttestation memory attestation) internal view returns (bytes memory) {
        bytes32 digest = vault.hashSlashAttestation(attestation);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ROFL_SIGNER_PK, digest);
        return abi.encodePacked(r, s, v);
    }
}
