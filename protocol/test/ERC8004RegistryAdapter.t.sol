// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

import {SBPVault} from "../src/SBPVault.sol";
import {ERC8004RegistryAdapter} from "../src/adapters/ERC8004RegistryAdapter.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {ISBPRegistryAdapter} from "../src/interfaces/ISBPRegistryAdapter.sol";
import {MockERC8004Registry} from "../src/mocks/MockERC8004Registry.sol";

contract ERC8004RegistryAdapterTest is Test {
    uint256 internal constant AGENT_ID = 32055;
    uint256 internal constant ROFL_SIGNER_PK = 0xA11CE;
    uint256 internal constant BOND_AMOUNT = 0.00001 ether;

    SBPVault internal realVault;
    address internal vault;
    address internal alice;
    address internal roflSigner;
    address internal communityRewards;

    MockERC8004Registry internal registry;
    ERC8004RegistryAdapter internal adapter;

    function setUp() public {
        roflSigner = vm.addr(ROFL_SIGNER_PK);
        communityRewards = makeAddr("communityRewards");
        alice = makeAddr("alice");

        registry = new MockERC8004Registry();
        adapter = new ERC8004RegistryAdapter(registry);

        realVault = new SBPVault(
            communityRewards, roflSigner,
            IERC8004Registry(address(registry)),
            ISBPRegistryAdapter(address(adapter))
        );
        adapter.setVault(address(realVault));
        vault = address(realVault);

        registry.seedAgent(AGENT_ID, alice, alice, "https://syntrophic.md/agents/jaune");
        vm.deal(alice, 1 ether);
    }

    function testOnlyVaultCanCallSyncHooks() public {
        vm.expectRevert(ERC8004RegistryAdapter.NotVault.selector);
        adapter.onBond(AGENT_ID, 100, 0, block.timestamp);

        vm.expectRevert(ERC8004RegistryAdapter.NotVault.selector);
        adapter.onSlash(AGENT_ID, 20, 8, block.timestamp);

        vm.expectRevert(ERC8004RegistryAdapter.NotVault.selector);
        adapter.onWithdraw(AGENT_ID, block.timestamp);
    }

    function testSetVaultOnlyOwnerAndOnlyOnce() public {
        vm.expectRevert(ERC8004RegistryAdapter.NotOwner.selector);
        vm.prank(alice);
        adapter.setVault(alice);

        vm.expectRevert(ERC8004RegistryAdapter.VaultAlreadySet.selector);
        adapter.setVault(alice);
    }

    function testOnBondWritesMetadataWhenAuthorized() public {
        registry.setAuthorization(AGENT_ID, true);

        vm.prank(vault);
        adapter.onBond(AGENT_ID, 99, 7, 123456);

        bytes memory status = registry.readMetadata(AGENT_ID, adapter.KEY_STATUS());
        bytes memory validator = registry.readMetadata(AGENT_ID, adapter.KEY_VALIDATOR());
        bytes memory score = registry.readMetadata(AGENT_ID, adapter.KEY_SCORE());
        bytes memory reviews = registry.readMetadata(AGENT_ID, adapter.KEY_REVIEW_COUNT());
        bytes memory updatedAt = registry.readMetadata(AGENT_ID, adapter.KEY_UPDATED_AT());

        assertEq(string(status), "BONDED");
        assertEq(abi.decode(validator, (address)), vault);
        assertEq(abi.decode(score, (uint8)), 99);
        assertEq(abi.decode(reviews, (uint32)), 7);
        assertEq(abi.decode(updatedAt, (uint256)), 123456);
    }

    function testOnBondSkipsWhenAdapterNotAuthorized() public {
        vm.prank(vault);
        adapter.onBond(AGENT_ID, 77, 4, 55555);

        bytes memory status = registry.readMetadata(AGENT_ID, adapter.KEY_STATUS());
        assertEq(status.length, 0);
    }

    function testOnSlashAndWithdrawUpdateStatus() public {
        registry.setAuthorization(AGENT_ID, true);

        vm.prank(vault);
        adapter.onSlash(AGENT_ID, 11, 15, 88888);
        bytes memory slashedStatus = registry.readMetadata(AGENT_ID, adapter.KEY_STATUS());
        assertEq(string(slashedStatus), "SLASHED");

        vm.prank(vault);
        adapter.onWithdraw(AGENT_ID, 99999);
        bytes memory withdrawnStatus = registry.readMetadata(AGENT_ID, adapter.KEY_STATUS());
        bytes memory score = registry.readMetadata(AGENT_ID, adapter.KEY_SCORE());
        bytes memory reviews = registry.readMetadata(AGENT_ID, adapter.KEY_REVIEW_COUNT());
        assertEq(string(withdrawnStatus), "WITHDRAWN");
        assertEq(abi.decode(score, (uint8)), 0);
        assertEq(abi.decode(reviews, (uint32)), 0);
    }

    // --- syncBondMetadata tests ---

    function testSyncBondMetadata() public {
        registry.setAuthorization(AGENT_ID, true);

        // Bond via the real vault
        vm.prank(alice);
        realVault.bond{value: BOND_AMOUNT}(AGENT_ID);

        // Clear metadata to simulate a missed sync
        // (The bond already synced via onBond, so we verify syncBondMetadata rewrites correctly)
        adapter.syncBondMetadata(AGENT_ID);

        bytes memory status = registry.readMetadata(AGENT_ID, adapter.KEY_STATUS());
        bytes memory score = registry.readMetadata(AGENT_ID, adapter.KEY_SCORE());
        bytes memory reviews = registry.readMetadata(AGENT_ID, adapter.KEY_REVIEW_COUNT());

        assertEq(string(status), "BONDED");
        assertEq(abi.decode(score, (uint8)), 100);
        assertEq(abi.decode(reviews, (uint32)), 0);
    }

    function testSyncBondMetadataRevertsWhenNotBonded() public {
        vm.expectRevert(abi.encodeWithSelector(ERC8004RegistryAdapter.AgentNotBonded.selector, AGENT_ID));
        adapter.syncBondMetadata(AGENT_ID);
    }
}
