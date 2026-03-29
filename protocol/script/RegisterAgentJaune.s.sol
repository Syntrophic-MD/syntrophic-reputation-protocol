// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";

contract RegisterAgentJaune is Script {
    error ExpectedWalletMismatch(address expected, address owner, address wallet);
    error WrongChain(uint256 chainId);

    function run() external returns (uint256 agentId) {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address registryAddress =
            vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));
        address expectedWallet = vm.envOr("AGENT_224_WALLET", vm.envOr("AGENT_JAUNE_WALLET", address(0)));
        string memory agentURI = vm.envOr("AGENT_URI", string("https://syntrophic.md/agents/224"));
        string memory agentName = vm.envOr("AGENT_NAME", string("Syntrophic Agent #224"));

        IERC8004Registry registry = IERC8004Registry(registryAddress);
        IERC8004Registry.MetadataEntry[] memory metadata = new IERC8004Registry.MetadataEntry[](1);
        metadata[0] = IERC8004Registry.MetadataEntry({metadataKey: "name", metadataValue: bytes(agentName)});

        vm.startBroadcast();
        agentId = registry.register(agentURI, metadata);
        vm.stopBroadcast();

        address owner = registry.ownerOf(agentId);
        address wallet = registry.getAgentWallet(agentId);
        string memory tokenUri = registry.tokenURI(agentId);

        if (expectedWallet != address(0) && owner != expectedWallet && wallet != expectedWallet) {
            revert ExpectedWalletMismatch(expectedWallet, owner, wallet);
        }

        console2.log("ERC-8004 Registry:", registryAddress);
        console2.log("Registered agentId:", agentId);
        console2.log("agentName:", agentName);
        console2.log("ownerOf(agentId):", owner);
        console2.log("getAgentWallet(agentId):", wallet);
        console2.log("tokenURI(agentId):", tokenUri);
    }
}
