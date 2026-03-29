// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {IERC8004Registry} from "../src/interfaces/IERC8004Registry.sol";

contract FetchAgentRecord is Script {
    error WrongChain(uint256 chainId);

    function run() external view {
        if (block.chainid != 8453) {
            revert WrongChain(block.chainid);
        }

        address registryAddress =
            vm.envOr("ERC8004_REGISTRY_ADDRESS", address(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432));
        uint256 agentId = vm.envUint("AGENT_ID");

        IERC8004Registry registry = IERC8004Registry(registryAddress);

        address owner = registry.ownerOf(agentId);
        address wallet = registry.getAgentWallet(agentId);
        string memory uri = registry.tokenURI(agentId);

        bytes memory status = registry.getMetadata(agentId, "syntrophic.status");
        bytes memory name = registry.getMetadata(agentId, "name");
        bytes memory validator = registry.getMetadata(agentId, "syntrophic.validator");
        bytes memory score = registry.getMetadata(agentId, "syntrophic.score");
        bytes memory reviewCount = registry.getMetadata(agentId, "syntrophic.reviewCount");
        bytes memory updatedAt = registry.getMetadata(agentId, "syntrophic.updatedAt");

        console2.log("ERC-8004 Registry:", registryAddress);
        console2.log("agentId:", agentId);
        console2.log("owner:", owner);
        console2.log("wallet:", wallet);
        console2.log("tokenURI:", uri);
        console2.log("name:", string(name));
        console2.log("syntrophic.status:", string(status));

        if (validator.length == 32) {
            console2.log("syntrophic.validator:", abi.decode(validator, (address)));
        } else {
            console2.log("syntrophic.validator raw bytes length:", validator.length);
        }

        if (score.length == 32) {
            console2.log("syntrophic.score:", uint256(uint8(abi.decode(score, (uint8)))));
        } else {
            console2.log("syntrophic.score raw bytes length:", score.length);
        }

        if (reviewCount.length == 32) {
            console2.log("syntrophic.reviewCount:", uint256(uint32(abi.decode(reviewCount, (uint32)))));
        } else {
            console2.log("syntrophic.reviewCount raw bytes length:", reviewCount.length);
        }

        if (updatedAt.length == 32) {
            console2.log("syntrophic.updatedAt:", abi.decode(updatedAt, (uint256)));
        } else {
            console2.log("syntrophic.updatedAt raw bytes length:", updatedAt.length);
        }
    }
}
