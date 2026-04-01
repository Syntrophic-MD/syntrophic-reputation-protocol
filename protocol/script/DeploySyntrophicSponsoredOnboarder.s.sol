// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {SRPVault} from "../src/SRPVault.sol";
import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";
import {SyntrophicSponsoredOnboarder} from "../src/SyntrophicSponsoredOnboarder.sol";

contract DeploySyntrophicSponsoredOnboarder is Script {
    function run() external returns (SyntrophicSponsoredOnboarder onboarder) {
        address vaultAddr = vm.envAddress("SRP_VAULT_ADDRESS");
        address registryAddr =
            vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));

        vm.startBroadcast();
        onboarder = new SyntrophicSponsoredOnboarder(SRPVault(vaultAddr), IERC8004Registry(registryAddr));
        vm.stopBroadcast();

        console2.log("SyntrophicSponsoredOnboarder deployed:", address(onboarder));
        console2.log("Vault:", vaultAddr);
        console2.log("Registry:", registryAddr);
    }
}
