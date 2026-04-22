// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title AttendanceNFT
/// @author AMS DApp — University of East London (CN6035)
/// @notice Soul-bound tier certificates awarded for cumulative attendance.
///         Tiers are bronze (5 sessions), silver (10), gold (20), and
///         platinum (30+); each tier may be minted at most once per wallet.
/// @dev Minimal certificate registry — intentionally not ERC-721 compliant
///      because transfer semantics don't fit the academic-credential model.
///      The backend (AttendanceNFT service) owns the deployer key and is
///      the only caller of `mintCertificate`.
contract AttendanceNFT {
    /// @notice Metadata for a single issued certificate.
    /// @param student          Wallet the certificate was minted to.
    /// @param studentId        Off-chain student identifier (e.g. "u21xxxxx").
    /// @param tier             Human-readable tier label ("bronze" | "silver" | "gold" | "platinum").
    /// @param sessionsAttended Lifetime check-in count at mint time.
    /// @param issuedAt         Block timestamp of minting.
    struct Certificate {
        address student;
        string studentId;
        string tier;
        uint256 sessionsAttended;
        uint256 issuedAt;
    }

    /// @notice Append-only list of all minted certificates. Token ID = index.
    Certificate[] public certificates;

    /// @notice Token IDs held by each student wallet.
    mapping(address => uint256[]) public studentCertificates;

    /// @notice Guard against minting the same tier to the same wallet twice.
    mapping(address => mapping(string => bool)) public hasTier;

    /// @notice Total certificates ever minted across all tiers.
    uint256 public totalMinted;

    /// @notice Emitted on every successful mint.
    /// @param tokenId          Assigned certificate id.
    /// @param student          Recipient wallet.
    /// @param studentId        Off-chain student identifier.
    /// @param tier             Tier label.
    /// @param sessionsAttended Lifetime check-in count at mint time.
    /// @param issuedAt         Block timestamp of inclusion.
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed student,
        string studentId,
        string tier,
        uint256 sessionsAttended,
        uint256 issuedAt
    );

    /// @notice Mint a tier certificate to a student wallet.
    /// @dev Reverts if the wallet already holds this tier. Caller is expected
    ///      to be the backend service account; there is no on-chain ACL
    ///      because the deployer key is held only by the server.
    /// @param _student          Recipient wallet.
    /// @param _studentId        Off-chain student identifier.
    /// @param _tier             Tier label.
    /// @param _sessionsAttended Lifetime check-in count at mint time.
    /// @return tokenId Assigned certificate id.
    function mintCertificate(
        address _student,
        string memory _studentId,
        string memory _tier,
        uint256 _sessionsAttended
    ) public returns (uint256) {
        require(!hasTier[_student][_tier], "Student already has this tier certificate");

        uint256 tokenId = certificates.length;
        certificates.push(Certificate({
            student: _student,
            studentId: _studentId,
            tier: _tier,
            sessionsAttended: _sessionsAttended,
            issuedAt: block.timestamp
        }));

        studentCertificates[_student].push(tokenId);
        hasTier[_student][_tier] = true;
        totalMinted++;

        emit CertificateMinted(tokenId, _student, _studentId, _tier, _sessionsAttended, block.timestamp);

        return tokenId;
    }

    /// @notice Fetch a certificate's metadata by token id.
    /// @param _tokenId Certificate id (zero-based).
    /// @return student          Recipient wallet.
    /// @return studentId        Off-chain student identifier.
    /// @return tier             Tier label.
    /// @return sessionsAttended Lifetime check-in count at mint time.
    /// @return issuedAt         Block timestamp of inclusion.
    function getCertificate(uint256 _tokenId) public view returns (
        address student,
        string memory studentId,
        string memory tier,
        uint256 sessionsAttended,
        uint256 issuedAt
    ) {
        require(_tokenId < certificates.length, "Token does not exist");
        Certificate memory cert = certificates[_tokenId];
        return (cert.student, cert.studentId, cert.tier, cert.sessionsAttended, cert.issuedAt);
    }

    /// @notice All certificate token ids held by a given wallet.
    /// @param _student Student wallet to query.
    /// @return Token ids owned by `_student`, in insertion order.
    function getStudentCertificates(address _student) public view returns (uint256[] memory) {
        return studentCertificates[_student];
    }

    /// @notice Total number of certificates minted.
    /// @return Running count across all tiers.
    function getTotalMinted() public view returns (uint256) {
        return totalMinted;
    }
}
