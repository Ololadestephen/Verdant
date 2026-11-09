// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title VerdantCheckIn
 * @notice Daily outdoor photo check-in and non-transferable milestone badge contract for Verdant on BOT Chain.
 * @dev Enforces EIP-712 signed attestations from an authorized verifier, strict one check-in per UTC day,
 *      consecutive-day streak calculation, replay protection, and soulbound ERC-721 milestone badges.
 */
contract VerdantCheckIn is ERC721, Ownable, EIP712 {
    using ECDSA for bytes32;

    // Struct representing an approved check-in claim
    struct CheckInClaim {
        address recipient;
        bytes32 submissionRef;
        uint256 utcDay;
        uint256 milestone; // 0 = none, 1 = welcome badge, 7 = 7d, 30 = 30d, 100 = 100d
        uint256 expiry;
        bytes32 nonce;
    }

    bytes32 public constant CLAIM_TYPEHASH = keccak256(
        "CheckInClaim(address recipient,bytes32 submissionRef,uint256 utcDay,uint256 milestone,uint256 expiry,bytes32 nonce)"
    );

    address public verifierSigner;
    uint256 private _nextTokenId;

    // Tracking state
    mapping(address => uint256) public lastCheckInUtcDay;
    mapping(address => uint256) public streak;
    mapping(address => uint256) public totalCheckIns;
    mapping(bytes32 => bool) public usedNonces;
    mapping(bytes32 => bool) public usedSubmissionRefs;
    mapping(address => mapping(uint256 => bool)) public hasMilestoneBadge;
    mapping(uint256 => uint256) public tokenMilestone; // tokenId => milestone

    // Events
    event VerifierSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event CheckInRecorded(
        address indexed recipient,
        uint256 indexed utcDay,
        uint256 newStreak,
        uint256 totalCheckIns,
        bytes32 submissionRef
    );
    event MilestoneBadgeAwarded(address indexed recipient, uint256 indexed milestone, uint256 tokenId);

    // Errors
    error InvalidSignerAddress();
    error NotRecipient();
    error SignatureExpired();
    error NonceAlreadyUsed();
    error SubmissionAlreadyClaimed();
    error InvalidUtcDay();
    error AlreadyCheckedInToday();
    error InvalidSignature();
    error MilestoneAlreadyAwarded();
    error StreakInsufficientForMilestone();
    error NonTransferableBadge();

    constructor(
        address initialOwner,
        address initialVerifierSigner
    ) ERC721("Verdant Badge", "VERDANT") Ownable(initialOwner) EIP712("VerdantCheckIn", "1") {
        if (initialVerifierSigner == address(0)) revert InvalidSignerAddress();
        verifierSigner = initialVerifierSigner;
        emit VerifierSignerUpdated(address(0), initialVerifierSigner);
    }

    /**
     * @notice Updates the verifier signer address.
     * @param newSigner New authorized verifier address.
     */
    function setVerifierSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert InvalidSignerAddress();
        address oldSigner = verifierSigner;
        verifierSigner = newSigner;
        emit VerifierSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Performs a verified check-in and optionally mints an earned milestone badge.
     * @param claim EIP-712 CheckInClaim struct.
     * @param signature Cryptographic signature by the verifierSigner.
     */
    function checkIn(CheckInClaim calldata claim, bytes calldata signature) external returns (uint256 awardedTokenId) {
        // 1. Recipient check
        if (msg.sender != claim.recipient) revert NotRecipient();

        // 2. Expiry check
        if (block.timestamp > claim.expiry) revert SignatureExpired();

        // 3. Replay checks
        if (usedNonces[claim.nonce]) revert NonceAlreadyUsed();
        if (usedSubmissionRefs[claim.submissionRef]) revert SubmissionAlreadyClaimed();

        // 4. UTC Day check
        // Current UTC day is block.timestamp / 86400
        uint256 currentUtcDay = block.timestamp / 86400;
        if (claim.utcDay > currentUtcDay || currentUtcDay - claim.utcDay > 1) {
            // Allows check-in for current day or immediately preceding day within expiry window
            revert InvalidUtcDay();
        }

        // 5. Daily limit: only one check-in per wallet per UTC day
        if (lastCheckInUtcDay[msg.sender] >= claim.utcDay) {
            revert AlreadyCheckedInToday();
        }

        // 6. EIP-712 Signature verification
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                claim.recipient,
                claim.submissionRef,
                claim.utcDay,
                claim.milestone,
                claim.expiry,
                claim.nonce
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(hash, signature);
        if (recoveredSigner != verifierSigner) revert InvalidSignature();

        // 7. Update check-in state before external calls / minting
        usedNonces[claim.nonce] = true;
        usedSubmissionRefs[claim.submissionRef] = true;

        uint256 lastDay = lastCheckInUtcDay[msg.sender];
        if (lastDay == claim.utcDay - 1) {
            streak[msg.sender] += 1;
        } else {
            streak[msg.sender] = 1;
        }
        lastCheckInUtcDay[msg.sender] = claim.utcDay;
        totalCheckIns[msg.sender] += 1;

        emit CheckInRecorded(
            msg.sender,
            claim.utcDay,
            streak[msg.sender],
            totalCheckIns[msg.sender],
            claim.submissionRef
        );

        // 8. Award milestone badge if requested and eligible
        if (claim.milestone > 0) {
            if (hasMilestoneBadge[msg.sender][claim.milestone]) {
                revert MilestoneAlreadyAwarded();
            }

            // Milestone 1: Welcome badge (awarded on 1st check-in or when streak >= 1)
            // Milestone 7/30/100: Streak milestones
            if (claim.milestone > 1 && streak[msg.sender] < claim.milestone) {
                revert StreakInsufficientForMilestone();
            }

            _nextTokenId++;
            awardedTokenId = _nextTokenId;
            hasMilestoneBadge[msg.sender][claim.milestone] = true;
            tokenMilestone[awardedTokenId] = claim.milestone;

            _safeMint(msg.sender, awardedTokenId);
            emit MilestoneBadgeAwarded(msg.sender, claim.milestone, awardedTokenId);
        }
    }

    /**
     * @dev Restricts transfer of badges to enforce Soulbound (non-transferable) tokens.
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == address(0)) or burning (to == address(0))
        if (from != address(0) && to != address(0)) {
            revert NonTransferableBadge();
        }
        return super._update(to, tokenId, auth);
    }
}
