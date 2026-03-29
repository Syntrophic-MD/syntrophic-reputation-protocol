// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {ERC8004RegistryAdapter} from "../src/adapters/ERC8004RegistryAdapter.sol";

contract DeployERC8004RegistryAdapter is Script {
    error WrongChain(uint256 chainId);

    function run() external returns (ERC8004RegistryAdapter adapter) {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address registry = vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));
        address vault = vm.envOr("SBP_VAULT_ADDRESS", address(0));

        vm.startBroadcast();
        adapter = new ERC8004RegistryAdapter(IERC8004Registry(registry));
        if (vault != address(0)) {
            adapter.setVault(vault);
        }
        vm.stopBroadcast();
    }
}
