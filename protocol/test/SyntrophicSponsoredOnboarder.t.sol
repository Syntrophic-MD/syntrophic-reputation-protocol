// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {SyntrophicSponsoredOnboarder} from "../src/SyntrophicSponsoredOnboarder.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {MockRegistryAdapter} from "../src/mocks/MockRegistryAdapter.sol";
import {MockERC8004Registry} from "../src/mocks/MockERC8004Registry.sol";

contract SyntrophicSponsoredOnboarderTest is Test {
    uint256 internal constant ROFL_SIGNER_PK = 0xA11CE;
    uint256 internal constant BOND_AMOUNT = 0.00001 ether;
    bytes32 internal constant PAYMENT_REF = keccak256("quote:demo");

    SRPVault internal vault;
    MockRegistryAdapter internal adapter;
    MockERC8004Registry internal registry;
    SyntrophicSponsoredOnboarder internal onboarder;

    address internal roflSigner;
    address internal communityRewards;
    address internal sponsor;
    address internal alice;

    event SponsoredOnboarded(
        uint256 indexed agentId,
        address indexed beneficiary,
        address indexed sponsor,
        uint256 bondAmount,
        string agentURI,
        bytes32 paymentRef
    );

    function setUp() public {
        roflSigner = vm.addr(ROFL_SIGNER_PK);
        communityRewards = makeAddr("communityRewards");
        sponsor = makeAddr("sponsor");
        alice = makeAddr("alice");

        adapter = new MockRegistryAdapter();
        registry = new MockERC8004Registry();
        vault = new SRPVault(communityRewards, roflSigner, IERC8004Registry(address(registry)), adapter);
        onboarder = new SyntrophicSponsoredOnboarder(vault, IERC8004Registry(address(registry)));

        vm.deal(sponsor, 1 ether);
        vm.deal(alice, 1 ether);
    }

    function testOnboardForRegistersAndBondsForBeneficiary() public {
        vm.prank(sponsor);
        uint256 agentId = onboarder.onboardFor{value: BOND_AMOUNT}(alice, "https://agent.uri", PAYMENT_REF);

        assertEq(registry.ownerOf(agentId), alice);
        assertTrue(vault.isBonded(agentId));
        assertEq(vault.getBondStatus(agentId).staker, alice);
        assertEq(adapter.bondCalls(), 1);
    }

    function testOnboardForEmitsSponsoredOnboarded() public {
        vm.expectEmit(true, true, true, true);
        emit SponsoredOnboarded(1, alice, sponsor, BOND_AMOUNT, "https://agent.uri", PAYMENT_REF);

        vm.prank(sponsor);
        onboarder.onboardFor{value: BOND_AMOUNT}(alice, "https://agent.uri", PAYMENT_REF);
    }

    function testOnboardForRefundsExcessToSponsor() public {
        uint256 balanceBefore = sponsor.balance;

        vm.prank(sponsor);
        onboarder.onboardFor{value: 0.001 ether}(alice, "https://agent.uri", PAYMENT_REF);

        uint256 spent = balanceBefore - sponsor.balance;
        assertEq(spent, BOND_AMOUNT);
    }

    function testBeneficiaryCanUnstakeAndWithdrawSponsoredBond() public {
        vm.prank(sponsor);
        uint256 agentId = onboarder.onboardFor{value: BOND_AMOUNT}(alice, "https://agent.uri", PAYMENT_REF);

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

        uint256 balanceBefore = alice.balance;
        vm.prank(alice);
        vault.withdraw(agentId);

        assertEq(alice.balance, balanceBefore + BOND_AMOUNT);
        assertFalse(vault.isBonded(agentId));
    }

    function testOnboardForRevertsOnZeroBeneficiary() public {
        vm.prank(sponsor);
        vm.expectRevert(SyntrophicSponsoredOnboarder.InvalidBeneficiary.selector);
        onboarder.onboardFor{value: BOND_AMOUNT}(address(0), "https://agent.uri", PAYMENT_REF);
    }

    function testOnboardForRevertsOnInsufficientValue() public {
        vm.prank(sponsor);
        vm.expectRevert(SyntrophicSponsoredOnboarder.InsufficientBondAmount.selector);
        onboarder.onboardFor{value: 0}(alice, "https://agent.uri", PAYMENT_REF);
    }

    function testOnboardForRevertsOnZeroAddressVault() public {
        vm.expectRevert(SyntrophicSponsoredOnboarder.ZeroAddress.selector);
        new SyntrophicSponsoredOnboarder(SRPVault(address(0)), IERC8004Registry(address(registry)));
    }

    function testOnboardForRevertsOnZeroAddressRegistry() public {
        vm.expectRevert(SyntrophicSponsoredOnboarder.ZeroAddress.selector);
        new SyntrophicSponsoredOnboarder(vault, IERC8004Registry(address(0)));
    }

    function testOnERC721ReceivedReturnsSelector() public view {
        bytes4 selector = onboarder.onERC721Received(address(this), address(this), 1, "");
        assertEq(selector, onboarder.onERC721Received.selector);
    }
}
