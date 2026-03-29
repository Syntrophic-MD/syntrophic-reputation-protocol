// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IERC8004Registry} from "../interfaces/IERC8004Registry.sol";

contract MockERC8004Registry is IERC8004Registry {
    error Unauthorized();
    error UnknownAgent();

    uint256 public nextAgentId = 1;

    mapping(uint256 => address) public owners;
    mapping(uint256 => address) public wallets;
    mapping(uint256 => string) public uris;
    mapping(uint256 => bool) public writableByAdapter;
    mapping(uint256 => mapping(bytes32 => bytes)) private _metadata;

    function setAuthorization(uint256 agentId, bool canWrite_) external {
        writableByAdapter[agentId] = canWrite_;
    }

    function seedAgent(uint256 agentId, address owner_, address wallet_, string calldata uri_) external {
        owners[agentId] = owner_;
        wallets[agentId] = wallet_;
        uris[agentId] = uri_;
    }

    function readMetadata(uint256 agentId, string calldata metadataKey) external view returns (bytes memory) {
        return _metadata[agentId][keccak256(bytes(metadataKey))];
    }

    function register() external returns (uint256 agentId) {
        return _register("mock://empty");
    }

    function register(string calldata agentURI) public returns (uint256 agentId) {
        return _register(agentURI);
    }

    function _register(string memory agentURI) internal returns (uint256 agentId) {
        agentId = nextAgentId++;
        owners[agentId] = msg.sender;
        wallets[agentId] = msg.sender;
        uris[agentId] = agentURI;
    }

    function register(string calldata agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId) {
        agentId = register(agentURI);
        for (uint256 i = 0; i < metadata.length; i++) {
            _metadata[agentId][keccak256(bytes(metadata[i].metadataKey))] = metadata[i].metadataValue;
        }
    }

    function ownerOf(uint256 agentId) external view returns (address owner) {
        owner = owners[agentId];
        if (owner == address(0)) {
            revert UnknownAgent();
        }
    }

    function tokenURI(uint256 agentId) external view returns (string memory uri) {
        uri = uris[agentId];
    }

    function getAgentWallet(uint256 agentId) external view returns (address wallet) {
        wallet = wallets[agentId];
    }

    function isAuthorizedOrOwner(address, uint256 agentId) external view returns (bool) {
        return writableByAdapter[agentId];
    }

    function getMetadata(uint256 agentId, string calldata metadataKey)
        external
        view
        returns (bytes memory metadataValue)
    {
        metadataValue = _metadata[agentId][keccak256(bytes(metadataKey))];
    }

    function setMetadata(uint256 agentId, string calldata metadataKey, bytes calldata metadataValue) external {
        if (!writableByAdapter[agentId]) {
            revert Unauthorized();
        }
        _metadata[agentId][keccak256(bytes(metadataKey))] = metadataValue;
    }
}
