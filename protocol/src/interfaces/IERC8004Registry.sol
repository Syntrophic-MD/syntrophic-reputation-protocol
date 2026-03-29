// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IERC8004Registry {
    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    function register() external returns (uint256 agentId);
    function register(string calldata agentURI) external returns (uint256 agentId);
    function register(string calldata agentURI, MetadataEntry[] calldata metadata) external returns (uint256 agentId);

    function ownerOf(uint256 agentId) external view returns (address owner);
    function tokenURI(uint256 agentId) external view returns (string memory uri);
    function getAgentWallet(uint256 agentId) external view returns (address wallet);
    function isAuthorizedOrOwner(address spender, uint256 agentId) external view returns (bool);

    function getMetadata(uint256 agentId, string calldata metadataKey)
        external
        view
        returns (bytes memory metadataValue);
    function setMetadata(uint256 agentId, string calldata metadataKey, bytes calldata metadataValue) external;
}
