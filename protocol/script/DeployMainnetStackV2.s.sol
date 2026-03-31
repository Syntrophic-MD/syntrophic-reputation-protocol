// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {ERC8004RegistryAdapter} from "../src/adapters/ERC8004RegistryAdapter.sol";
import {SyntrophicOnboarder} from "../src/SyntrophicOnboarder.sol";

/// @notice Deploys the full Sprint 0 stack: adapter + vault + onboarder.
///         Old vault (0xb3E7...) stays live — agent #222 remains bonded there.
contract DeployMainnetStackV2 is Script {
    error WrongChain(uint256 chainId);

    function run()
        external
        returns (ERC8004RegistryAdapter adapter, SRPVault vault, SyntrophicOnboarder onboarder)
    {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address communityRewards = vm.envAddress("COMMUNITY_REWARDS_ADDRESS");
        address roflSigner = vm.envAddress("ROFL_SIGNER_ADDRESS");
        address registry =
            vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));

        vm.startBroadcast();

        // 1. Deploy adapter
        adapter = new ERC8004RegistryAdapter(IERC8004Registry(registry));

        // 2. Deploy vault with adapter
        vault = new SRPVault(communityRewards, roflSigner, IERC8004Registry(registry), adapter);

        // 3. Wire adapter to vault (one-time)
        adapter.setVault(address(vault));

        // 4. Deploy onboarder
        onboarder = new SyntrophicOnboarder(vault, IERC8004Registry(registry));

        vm.stopBroadcast();

        console2.log("=== Sprint 0 Mainnet Deployment ===");
        console2.log("ERC-8004 Registry:", registry);
        console2.log("Adapter (V2):", address(adapter));
        console2.log("Vault (V2):", address(vault));
        console2.log("Onboarder:", address(onboarder));
        console2.log("");
        console2.log("Old vault (agent #222 stays here):", address(0xb3E75c11957a23F9A8DF2A2eB59513832c8d1248));
    }
}
