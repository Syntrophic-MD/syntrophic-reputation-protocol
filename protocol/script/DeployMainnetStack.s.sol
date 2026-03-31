// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {ERC8004RegistryAdapter} from "../src/adapters/ERC8004RegistryAdapter.sol";

contract DeployMainnetStack is Script {
    error WrongChain(uint256 chainId);

    function run() external returns (SRPVault vault, ERC8004RegistryAdapter adapter) {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address communityRewards = vm.envAddress("COMMUNITY_REWARDS_ADDRESS");
        address roflSigner = vm.envAddress("ROFL_SIGNER_ADDRESS");
        address registry = vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));

        vm.startBroadcast();
        adapter = new ERC8004RegistryAdapter(IERC8004Registry(registry));
        vault = new SRPVault(communityRewards, roflSigner, IERC8004Registry(registry), adapter);
        adapter.setVault(address(vault));
        vm.stopBroadcast();

        console2.log("Mainnet deployment complete.");
        console2.log("ERC8004 registry:", registry);
        console2.log("Adapter:", address(adapter));
        console2.log("Vault:", address(vault));
    }
}
