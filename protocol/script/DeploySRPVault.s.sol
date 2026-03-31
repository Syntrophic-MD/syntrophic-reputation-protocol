// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {ISRPRegistryAdapter} from "../src/interfaces/ISRPRegistryAdapter.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";

contract DeploySRPVault is Script {
    error WrongChain(uint256 chainId);

    function run() external returns (SRPVault vault) {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address communityRewards = vm.envAddress("COMMUNITY_REWARDS_ADDRESS");
        address roflSigner = vm.envAddress("ROFL_SIGNER_ADDRESS");
        address registry = vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));
        address registryAdapter = vm.envOr("REGISTRY_ADAPTER_ADDRESS", address(0));

        vm.startBroadcast();
        vault = new SRPVault(
            communityRewards, roflSigner, IERC8004Registry(registry), ISRPRegistryAdapter(registryAdapter)
        );
        vm.stopBroadcast();
    }
}
