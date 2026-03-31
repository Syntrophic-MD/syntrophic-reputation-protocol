// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {SyntrophicOnboarder} from "../src/SyntrophicOnboarder.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {MockRegistryAdapter} from "../src/mocks/MockRegistryAdapter.sol";
import {MockERC8004Registry} from "../src/mocks/MockERC8004Registry.sol";

contract SyntrophicOnboarderTest is Test {
    uint256 internal constant ROFL_SIGNER_PK = 0xA11CE;
    uint256 internal constant BOND_AMOUNT = 0.00001 ether;

    SRPVault internal vault;
    MockRegistryAdapter internal adapter;
    MockERC8004Registry internal registry;
    SyntrophicOnboarder internal onboarder;

    address internal roflSigner;
    address internal communityRewards;
    address internal alice;

    function setUp() public {
        roflSigner = vm.addr(ROFL_SIGNER_PK);
        communityRewards = makeAddr("communityRewards");
        alice = makeAddr("alice");

        adapter = new MockRegistryAdapter();
        registry = new MockERC8004Registry();
        vault = new SRPVault(communityRewards, roflSigner, IERC8004Registry(address(registry)), adapter);
        onboarder = new SyntrophicOnboarder(vault, IERC8004Registry(address(registry)));

        vm.deal(alice, 1 ether);
    }

    function testOnboardRegistersAndBonds() public {
        vm.prank(alice);
        uint256 agentId = onboarder.onboard{value: BOND_AMOUNT}("https://agent.uri");

        assertEq(registry.ownerOf(agentId), alice);
        assertTrue(vault.isBonded(agentId));
        assertEq(vault.getBondStatus(agentId).staker, alice);
        assertEq(adapter.bondCalls(), 1);
    }

    function testOnboardRefundsExcess() public {
        uint256 balBefore = alice.balance;

        vm.prank(alice);
        onboarder.onboard{value: 0.001 ether}("https://agent.uri");

        // Alice should have paid exactly BOND_AMOUNT (plus gas, but we ignore gas in this check)
        uint256 spent = balBefore - alice.balance;
        assertEq(spent, BOND_AMOUNT);
    }

    function testOnboardRevertsOnInsufficientValue() public {
        vm.prank(alice);
        vm.expectRevert(SyntrophicOnboarder.InsufficientBondAmount.selector);
        onboarder.onboard{value: 0}("https://agent.uri");
    }

    function testOnboardedAgentCanUnstakeAndWithdraw() public {
        vm.prank(alice);
        uint256 agentId = onboarder.onboard{value: BOND_AMOUNT}("https://agent.uri");

        // Update score to high-trust for instant unstake
        SRPVault.ScoreAttestation memory att = SRPVault.ScoreAttestation({
            agentId: agentId,
            score: 90,
            reviewCount: 11,
            nonce: 1,
            deadline: uint64(block.timestamp + 1 hours)
        });
        bytes32 digest = vault.hashScoreAttestation(att);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ROFL_SIGNER_PK, digest);
        vault.updateScore(att, abi.encodePacked(r, s, v));

        vm.prank(alice);
        vault.requestUnstake(agentId);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(agentId);

        assertEq(alice.balance, balBefore + BOND_AMOUNT);
        assertFalse(vault.isBonded(agentId));
    }

    function testOnboardRevertsOnZeroAddressVault() public {
        vm.expectRevert(SyntrophicOnboarder.ZeroAddress.selector);
        new SyntrophicOnboarder(SRPVault(address(0)), IERC8004Registry(address(registry)));
    }

    function testOnboardRevertsOnZeroAddressRegistry() public {
        vm.expectRevert(SyntrophicOnboarder.ZeroAddress.selector);
        new SyntrophicOnboarder(vault, IERC8004Registry(address(0)));
    }
}
