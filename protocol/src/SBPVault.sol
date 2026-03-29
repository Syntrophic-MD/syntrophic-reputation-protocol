// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ISBPRegistryAdapter} from "./interfaces/ISBPRegistryAdapter.sol";
import {IERC8004Registry} from "./interfaces/IERC8004Registry.sol";

contract SBPVault {
    uint256 public constant BOND_AMOUNT = 0.00001 ether; // hackathon default
    uint8 public constant MAX_SCORE = 100;
    uint8 public constant SLASH_THRESHOLD = 51; // slash if score < 51
    uint256 public constant STANDARD_WINDOW_BLOCKS = 300;
    uint256 public constant NEW_USER_WINDOW_BLOCKS = 1800;
    uint256 public constant COOLDOWN_SECONDS = 30 days;

    bytes32 public constant SCORE_ATTESTATION_TYPEHASH =
        keccak256("ScoreAttestation(uint256 agentId,uint8 score,uint32 reviewCount,uint64 nonce,uint64 deadline)");
    bytes32 public constant SLASH_ATTESTATION_TYPEHASH = keccak256(
        "SlashAttestation(uint256 agentId,uint8 score,uint64 stakeId,uint64 nonce,uint64 deadline,bytes32 evidenceHash)"
    );

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant HASHED_NAME = keccak256("SyntrophicBondProtocol");
    bytes32 private constant HASHED_VERSION = keccak256("1");

    uint256 private constant REENTRANCY_UNLOCKED = 1;
    uint256 private constant REENTRANCY_LOCKED = 2;
    uint256 private constant ECDSA_MALLEABILITY_THRESHOLD =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    error ZeroAddress();
    error InvalidScore();
    error InvalidBondAmount();
    error AlreadyBonded();
    error NotBonded();
    error NotBondStaker();
    error InCooldown(uint256 cooldownEndsAt);
    error UnstakeNotRequested();
    error ChallengeWindowActive(uint256 unlockBlock);
    error InvalidSigner();
    error AttestationExpired();
    error NonceNotIncreasing();
    error SlashNotRequired();
    error StakeIdMismatch();
    error AttestationAlreadyUsed();
    error TransferFailed();
    error Reentrancy();
    error NotAgentOwner(address agentOwner);

    struct BondInfo {
        address staker;
        uint96 amount;
        uint64 bondedAt;
        uint64 unlockBlock;
        uint64 stakeId;
        uint64 lastScoreNonce;
        uint32 reviewCount;
        uint8 score;
        bool active;
    }

    struct BondStatus {
        bool isBonded;
        address staker;
        uint256 bondAmount;
        uint256 bondedAt;
        uint256 score;
        uint256 reviewCount;
        uint256 unlockBlock;
        uint256 stakeId;
        uint256 cooldownEndsAt;
    }

    struct ScoreAttestation {
        uint256 agentId;
        uint8 score;
        uint32 reviewCount;
        uint64 nonce;
        uint64 deadline;
    }

    struct SlashAttestation {
        uint256 agentId;
        uint8 score;
        uint64 stakeId;
        uint64 nonce;
        uint64 deadline;
        bytes32 evidenceHash;
    }

    event AgentBonded(
        uint256 indexed agentId, uint256 indexed stakeId, address indexed staker, uint256 amount, uint256 timestamp
    );
    event ScoreUpdated(uint256 indexed agentId, uint8 score, uint32 reviewCount, uint64 nonce, uint256 timestamp);
    event UnstakeRequested(uint256 indexed agentId, uint256 unlockBlock, uint8 score, uint32 reviewCount);
    event BondWithdrawn(uint256 indexed agentId, address indexed staker, uint256 amount, uint256 timestamp);
    event SlashExecuted(
        uint256 indexed agentId,
        uint256 indexed stakeId,
        address indexed staker,
        uint256 amount,
        uint8 score,
        uint256 cooldownEndsAt,
        bytes32 attestationDigest
    );

    address public immutable communityRewards;
    address public immutable roflSigner;
    IERC8004Registry public immutable identityRegistry;
    ISBPRegistryAdapter public immutable registryAdapter;

    bytes32 private immutable DOMAIN_SEPARATOR;
    uint256 private immutable CACHED_CHAIN_ID;

    uint64 private _nextStakeId;
    uint256 private _reentrancyStatus;

    mapping(uint256 agentId => BondInfo) private _bonds;
    mapping(uint256 agentId => uint256 cooldownEndsAt) public cooldownUntil;
    mapping(uint256 agentId => mapping(uint64 nonce => bool used)) public usedSlashNonce;

    constructor(
        address communityRewards_,
        address roflSigner_,
        IERC8004Registry identityRegistry_,
        ISBPRegistryAdapter registryAdapter_
    ) {
        if (communityRewards_ == address(0) || roflSigner_ == address(0)) {
            revert ZeroAddress();
        }
        if (address(identityRegistry_) == address(0)) {
            revert ZeroAddress();
        }

        communityRewards = communityRewards_;
        roflSigner = roflSigner_;
        identityRegistry = identityRegistry_;
        registryAdapter = registryAdapter_;

        CACHED_CHAIN_ID = block.chainid;
        DOMAIN_SEPARATOR = _buildDomainSeparator(block.chainid);
        _reentrancyStatus = REENTRANCY_UNLOCKED;
    }

    modifier nonReentrant() {
        if (_reentrancyStatus == REENTRANCY_LOCKED) {
            revert Reentrancy();
        }

        _reentrancyStatus = REENTRANCY_LOCKED;
        _;
        _reentrancyStatus = REENTRANCY_UNLOCKED;
    }

    function bond(uint256 agentId) external payable nonReentrant {
        if (msg.value != BOND_AMOUNT) {
            revert InvalidBondAmount();
        }

        address agentOwner = identityRegistry.ownerOf(agentId);
        if (agentOwner != msg.sender) {
            revert NotAgentOwner(agentOwner);
        }

        BondInfo storage existing = _bonds[agentId];
        if (existing.active) {
            revert AlreadyBonded();
        }

        uint256 cooldownEndsAt = cooldownUntil[agentId];
        if (block.timestamp < cooldownEndsAt) {
            revert InCooldown(cooldownEndsAt);
        }

        uint64 stakeId = ++_nextStakeId;
        _bonds[agentId] = BondInfo({
            staker: msg.sender,
            amount: uint96(msg.value),
            bondedAt: uint64(block.timestamp),
            unlockBlock: 0,
            stakeId: stakeId,
            lastScoreNonce: 0,
            reviewCount: 0,
            score: MAX_SCORE,
            active: true
        });

        if (address(registryAdapter) != address(0)) {
            registryAdapter.onBond(agentId, MAX_SCORE, 0, block.timestamp);
        }

        emit AgentBonded(agentId, stakeId, msg.sender, msg.value, block.timestamp);
    }

    function updateScore(ScoreAttestation calldata attestation, bytes calldata signature) external {
        if (attestation.score > MAX_SCORE) {
            revert InvalidScore();
        }
        if (block.timestamp > attestation.deadline) {
            revert AttestationExpired();
        }

        BondInfo storage bondInfo = _bonds[attestation.agentId];
        if (!bondInfo.active) {
            revert NotBonded();
        }
        if (attestation.nonce <= bondInfo.lastScoreNonce) {
            revert NonceNotIncreasing();
        }

        bytes32 digest = hashScoreAttestation(attestation);
        if (_recover(digest, signature) != roflSigner) {
            revert InvalidSigner();
        }

        bondInfo.lastScoreNonce = attestation.nonce;
        bondInfo.score = attestation.score;
        bondInfo.reviewCount = attestation.reviewCount;

        emit ScoreUpdated(
            attestation.agentId, attestation.score, attestation.reviewCount, attestation.nonce, block.timestamp
        );
    }

    function requestUnstake(uint256 agentId) external {
        BondInfo storage bondInfo = _bonds[agentId];
        if (!bondInfo.active) {
            revert NotBonded();
        }
        if (bondInfo.staker != msg.sender) {
            revert NotBondStaker();
        }

        uint256 challengeWindow = _challengeWindowBlocks(bondInfo.score, bondInfo.reviewCount);
        uint64 unlockBlock = uint64(block.number + challengeWindow);
        bondInfo.unlockBlock = unlockBlock;

        emit UnstakeRequested(agentId, unlockBlock, bondInfo.score, bondInfo.reviewCount);
    }

    function executeSlash(SlashAttestation calldata attestation, bytes calldata signature) external nonReentrant {
        if (attestation.score >= SLASH_THRESHOLD) {
            revert SlashNotRequired();
        }
        if (block.timestamp > attestation.deadline) {
            revert AttestationExpired();
        }
        if (usedSlashNonce[attestation.agentId][attestation.nonce]) {
            revert AttestationAlreadyUsed();
        }

        BondInfo memory bondInfo = _bonds[attestation.agentId];
        if (!bondInfo.active) {
            revert NotBonded();
        }
        if (bondInfo.stakeId != attestation.stakeId) {
            revert StakeIdMismatch();
        }

        bytes32 digest = hashSlashAttestation(attestation);
        if (_recover(digest, signature) != roflSigner) {
            revert InvalidSigner();
        }

        usedSlashNonce[attestation.agentId][attestation.nonce] = true;
        delete _bonds[attestation.agentId];

        uint256 cooldownEndsAt = block.timestamp + COOLDOWN_SECONDS;
        cooldownUntil[attestation.agentId] = cooldownEndsAt;

        (bool sent,) = payable(communityRewards).call{value: bondInfo.amount}("");
        if (!sent) {
            revert TransferFailed();
        }

        if (address(registryAdapter) != address(0)) {
            registryAdapter.onSlash(attestation.agentId, attestation.score, bondInfo.reviewCount, block.timestamp);
        }

        emit SlashExecuted(
            attestation.agentId,
            attestation.stakeId,
            bondInfo.staker,
            bondInfo.amount,
            attestation.score,
            cooldownEndsAt,
            digest
        );
    }

    function withdraw(uint256 agentId) external nonReentrant {
        BondInfo memory bondInfo = _bonds[agentId];
        if (!bondInfo.active) {
            revert NotBonded();
        }
        if (bondInfo.staker != msg.sender) {
            revert NotBondStaker();
        }
        if (bondInfo.unlockBlock == 0) {
            revert UnstakeNotRequested();
        }
        if (block.number < bondInfo.unlockBlock) {
            revert ChallengeWindowActive(bondInfo.unlockBlock);
        }

        delete _bonds[agentId];

        (bool sent,) = payable(bondInfo.staker).call{value: bondInfo.amount}("");
        if (!sent) {
            revert TransferFailed();
        }

        if (address(registryAdapter) != address(0)) {
            registryAdapter.onWithdraw(agentId, block.timestamp);
        }

        emit BondWithdrawn(agentId, bondInfo.staker, bondInfo.amount, block.timestamp);
    }

    function getBondStatus(uint256 agentId) external view returns (BondStatus memory) {
        BondInfo memory bondInfo = _bonds[agentId];
        return BondStatus({
            isBonded: bondInfo.active,
            staker: bondInfo.staker,
            bondAmount: bondInfo.amount,
            bondedAt: bondInfo.bondedAt,
            score: bondInfo.score,
            reviewCount: bondInfo.reviewCount,
            unlockBlock: bondInfo.unlockBlock,
            stakeId: bondInfo.stakeId,
            cooldownEndsAt: cooldownUntil[agentId]
        });
    }

    function isBonded(uint256 agentId) external view returns (bool) {
        return _bonds[agentId].active;
    }

    function hashScoreAttestation(ScoreAttestation calldata attestation) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                SCORE_ATTESTATION_TYPEHASH,
                attestation.agentId,
                attestation.score,
                attestation.reviewCount,
                attestation.nonce,
                attestation.deadline
            )
        );
        return _hashTypedData(structHash);
    }

    function hashSlashAttestation(SlashAttestation calldata attestation) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                SLASH_ATTESTATION_TYPEHASH,
                attestation.agentId,
                attestation.score,
                attestation.stakeId,
                attestation.nonce,
                attestation.deadline,
                attestation.evidenceHash
            )
        );
        return _hashTypedData(structHash);
    }

    function challengeWindowBlocks(uint256 agentId) external view returns (uint256) {
        BondInfo memory bondInfo = _bonds[agentId];
        if (!bondInfo.active) {
            return 0;
        }
        return _challengeWindowBlocks(bondInfo.score, bondInfo.reviewCount);
    }

    function _challengeWindowBlocks(uint8 score, uint32 reviewCount) internal pure returns (uint256) {
        if (score > 80 && reviewCount > 10) {
            return 0;
        }
        if (reviewCount < 3) {
            return NEW_USER_WINDOW_BLOCKS;
        }
        return STANDARD_WINDOW_BLOCKS;
    }

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
    }

    function _domainSeparator() internal view returns (bytes32) {
        if (block.chainid == CACHED_CHAIN_ID) {
            return DOMAIN_SEPARATOR;
        }
        return _buildDomainSeparator(block.chainid);
    }

    function _buildDomainSeparator(uint256 chainId) internal view returns (bytes32) {
        return keccak256(abi.encode(EIP712_DOMAIN_TYPEHASH, HASHED_NAME, HASHED_VERSION, chainId, address(this)));
    }

    function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return address(0);
        }
        if (uint256(s) > ECDSA_MALLEABILITY_THRESHOLD) {
            return address(0);
        }

        return ecrecover(digest, v, r, s);
    }
}
