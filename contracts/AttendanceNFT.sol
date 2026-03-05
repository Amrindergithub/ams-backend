// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AttendanceNFT {
    struct Certificate {
        address student;
        string studentId;
        string tier;
        uint256 sessionsAttended;
        uint256 issuedAt;
    }

    Certificate[] public certificates;
    mapping(address => uint256[]) public studentCertificates;
    mapping(address => mapping(string => bool)) public hasTier;

    uint256 public totalMinted;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed student,
        string studentId,
        string tier,
        uint256 sessionsAttended,
        uint256 issuedAt
    );

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

    function getStudentCertificates(address _student) public view returns (uint256[] memory) {
        return studentCertificates[_student];
    }

    function getTotalMinted() public view returns (uint256) {
        return totalMinted;
    }
}