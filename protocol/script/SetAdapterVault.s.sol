// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";

import {ERC8004RegistryAdapter} from "../src/adapters/ERC8004RegistryAdapter.sol";

contract SetAdapterVault is Script {
    error WrongChain(uint256 chainId);

    function run() external {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address adapterAddress = vm.envAddress("REGISTRY_ADAPTER_ADDRESS");
        address vaultAddress = vm.envAddress("SBP_VAULT_ADDRESS");

        vm.startBroadcast();
        ERC8004RegistryAdapter(adapterAddress).setVault(vaultAddress);
        vm.stopBroadcast();
    }
}
