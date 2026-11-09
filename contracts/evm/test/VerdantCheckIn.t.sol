// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VerdantCheckIn.sol";

contract VerdantCheckInTest is Test {
    VerdantCheckIn public checkInContract;

    uint256 internal ownerPrivateKey = 0xA11CE;
    address internal owner = vm.addr(ownerPrivateKey);

    uint256 internal verifierPrivateKey = 0xB0B;
    address internal verifier = vm.addr(verifierPrivateKey);

    uint256 internal alicePrivateKey = 0xA11C3;
    address internal alice = vm.addr(alicePrivateKey);

    uint256 internal bobPrivateKey = 0xB0B1;
    address internal bob = vm.addr(bobPrivateKey);

    bytes32 internal DOMAIN_SEPARATOR;
    bytes32 internal CLAIM_TYPEHASH;

    function setUp() public {
        vm.prank(owner);
        checkInContract = new VerdantCheckIn(owner, verifier);

        CLAIM_TYPEHASH = checkInContract.CLAIM_TYPEHASH();

        // Compute domain separator matching contract
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("VerdantCheckIn")),
                keccak256(bytes("1")),
                block.chainid,
                address(checkInContract)
            )
        );

        // Warp to day 1000 (timestamp: 1000 * 86400 = 86,400,000)
        vm.warp(1000 * 86400 + 3600); // 1 hour into day 1000
    }

    function _signClaim(
        uint256 signerKey,
        VerdantCheckIn.CheckInClaim memory claim
    ) internal view returns (bytes memory) {
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

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_InitialState() public view {
        assertEq(checkInContract.owner(), owner);
        assertEq(checkInContract.verifierSigner(), verifier);
        assertEq(checkInContract.name(), "Verdant Badge");
        assertEq(checkInContract.symbol(), "VERDANT");
    }

    function test_ValidCheckIn_WithWelcomeBadge() public {
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("submission-1"),
            utcDay: currentDay,
            milestone: 1, // Welcome badge
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory sig = _signClaim(verifierPrivateKey, claim);

        vm.prank(alice);
        uint256 tokenId = checkInContract.checkIn(claim, sig);

        assertEq(tokenId, 1);
        assertEq(checkInContract.ownerOf(1), alice);
        assertEq(checkInContract.streak(alice), 1);
        assertEq(checkInContract.totalCheckIns(alice), 1);
        assertEq(checkInContract.lastCheckInUtcDay(alice), currentDay);
        assertTrue(checkInContract.hasMilestoneBadge(alice, 1));
        assertTrue(checkInContract.usedNonces(claim.nonce));
        assertTrue(checkInContract.usedSubmissionRefs(claim.submissionRef));
    }

    function test_Revert_WhenSenderNotRecipient() public {
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory sig = _signClaim(verifierPrivateKey, claim);

        // Bob tries to submit Alice's claim
        vm.prank(bob);
        vm.expectRevert(VerdantCheckIn.NotRecipient.selector);
        checkInContract.checkIn(claim, sig);
    }

    function test_Revert_WhenExpired() public {
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp - 1, // expired
            nonce: keccak256("nonce-1")
        });

        bytes memory sig = _signClaim(verifierPrivateKey, claim);

        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.SignatureExpired.selector);
        checkInContract.checkIn(claim, sig);
    }

    function test_Revert_WhenNonceReused() public {
        uint256 currentDay = block.timestamp / 86400;
        bytes32 nonce = keccak256("shared-nonce");

        VerdantCheckIn.CheckInClaim memory claim1 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: nonce
        });

        bytes memory sig1 = _signClaim(verifierPrivateKey, claim1);

        vm.prank(alice);
        checkInContract.checkIn(claim1, sig1);

        // Advance to next day
        vm.warp(block.timestamp + 86400);
        uint256 nextDay = block.timestamp / 86400;

        VerdantCheckIn.CheckInClaim memory claim2 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-2"),
            utcDay: nextDay,
            milestone: 0,
            expiry: block.timestamp + 3600,
            nonce: nonce // Reused nonce!
        });

        bytes memory sig2 = _signClaim(verifierPrivateKey, claim2);

        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.NonceAlreadyUsed.selector);
        checkInContract.checkIn(claim2, sig2);
    }

    function test_Revert_WhenSubmissionRefReused() public {
        uint256 currentDay = block.timestamp / 86400;
        bytes32 subRef = keccak256("photo-hash-1");

        VerdantCheckIn.CheckInClaim memory claim1 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: subRef,
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory sig1 = _signClaim(verifierPrivateKey, claim1);

        vm.prank(alice);
        checkInContract.checkIn(claim1, sig1);

        // Advance to next day
        vm.warp(block.timestamp + 86400);
        uint256 nextDay = block.timestamp / 86400;

        // Try to reuse same submission reference
        VerdantCheckIn.CheckInClaim memory claim2 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: subRef, // Reused submissionRef
            utcDay: nextDay,
            milestone: 0,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-2")
        });

        bytes memory sig2 = _signClaim(verifierPrivateKey, claim2);

        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.SubmissionAlreadyClaimed.selector);
        checkInContract.checkIn(claim2, sig2);
    }

    function test_Revert_DuplicateSameDayClaim() public {
        uint256 currentDay = block.timestamp / 86400;

        VerdantCheckIn.CheckInClaim memory claim1 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory sig1 = _signClaim(verifierPrivateKey, claim1);

        vm.prank(alice);
        checkInContract.checkIn(claim1, sig1);

        // Second claim on the same UTC day
        VerdantCheckIn.CheckInClaim memory claim2 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-2"),
            utcDay: currentDay,
            milestone: 0,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-2")
        });

        bytes memory sig2 = _signClaim(verifierPrivateKey, claim2);

        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.AlreadyCheckedInToday.selector);
        checkInContract.checkIn(claim2, sig2);
    }

    function test_Revert_InvalidSigner() public {
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        // Sign with unauthorized key
        bytes memory sig = _signClaim(bobPrivateKey, claim);

        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.InvalidSignature.selector);
        checkInContract.checkIn(claim, sig);
    }

    function test_StreakProgressionAndReset() public {
        // Day 1: Check in
        uint256 day1 = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim1 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-day-1"),
            utcDay: day1,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-day-1")
        });
        bytes memory sig1 = _signClaim(verifierPrivateKey, claim1);
        vm.prank(alice);
        checkInContract.checkIn(claim1, sig1);
        assertEq(checkInContract.streak(alice), 1);

        // Day 2: Consecutive check in -> streak becomes 2
        vm.warp(block.timestamp + 86400);
        uint256 day2 = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim2 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-day-2"),
            utcDay: day2,
            milestone: 0,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-day-2")
        });
        bytes memory sig2 = _signClaim(verifierPrivateKey, claim2);
        vm.prank(alice);
        checkInContract.checkIn(claim2, sig2);
        assertEq(checkInContract.streak(alice), 2);

        // Day 4: Missed Day 3! -> streak resets to 1
        vm.warp(block.timestamp + 2 * 86400);
        uint256 day4 = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim4 = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-day-4"),
            utcDay: day4,
            milestone: 0,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-day-4")
        });
        bytes memory sig4 = _signClaim(verifierPrivateKey, claim4);
        vm.prank(alice);
        checkInContract.checkIn(claim4, sig4);
        assertEq(checkInContract.streak(alice), 1);
        assertEq(checkInContract.totalCheckIns(alice), 3);
    }

    function test_Soulbound_NonTransferable() public {
        // Alice checks in and receives badge #1
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory sig = _signClaim(verifierPrivateKey, claim);
        vm.prank(alice);
        uint256 tokenId = checkInContract.checkIn(claim, sig);
        assertEq(tokenId, 1);

        // Alice tries to transfer to Bob -> must revert!
        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.NonTransferableBadge.selector);
        checkInContract.transferFrom(alice, bob, 1);

        // Alice tries safeTransferFrom -> must revert!
        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.NonTransferableBadge.selector);
        checkInContract.safeTransferFrom(alice, bob, 1);
    }

    function test_VerifierSignerRotation() public {
        address newVerifier = vm.addr(0x999);

        // Non-owner cannot update verifier
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        checkInContract.setVerifierSigner(newVerifier);

        // Owner updates verifier
        vm.prank(owner);
        checkInContract.setVerifierSigner(newVerifier);
        assertEq(checkInContract.verifierSigner(), newVerifier);

        // Old verifier signature fails now
        uint256 currentDay = block.timestamp / 86400;
        VerdantCheckIn.CheckInClaim memory claim = VerdantCheckIn.CheckInClaim({
            recipient: alice,
            submissionRef: keccak256("sub-1"),
            utcDay: currentDay,
            milestone: 1,
            expiry: block.timestamp + 3600,
            nonce: keccak256("nonce-1")
        });

        bytes memory oldSig = _signClaim(verifierPrivateKey, claim);
        vm.prank(alice);
        vm.expectRevert(VerdantCheckIn.InvalidSignature.selector);
        checkInContract.checkIn(claim, oldSig);

        // New verifier signature succeeds
        bytes memory newSig = _signClaim(0x999, claim);
        vm.prank(alice);
        checkInContract.checkIn(claim, newSig);
        assertEq(checkInContract.streak(alice), 1);
    }
}
