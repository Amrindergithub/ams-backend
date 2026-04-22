// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title AttendanceRecord
/// @author AMS DApp — University of East London (CN6035)
/// @notice Immutable ledger of attendance commitments. The backend hashes
///         (studentId, courseId, date) off-chain and submits only the digest,
///         so no PII is ever written to the chain.
/// @dev Each hash may be recorded at most once. Duplicates revert so the
///      contract doubles as an anti-replay guard for the check-in flow.
contract AttendanceRecord {
    /// @notice A single attendance commitment.
    /// @param student        Address that submitted the record (admin signer).
    /// @param attendanceHash keccak256(studentId || courseId || date).
    /// @param timestamp      Block timestamp when the record was mined.
    struct Record {
        address student;
        bytes32 attendanceHash;
        uint256 timestamp;
    }

    /// @notice Append-only list of every recorded attendance.
    Record[] public records;

    /// @notice Fast look-up: was this hash ever submitted?
    mapping(bytes32 => bool) public hashExists;

    /// @notice Index into `records` for a given hash (valid iff hashExists).
    mapping(bytes32 => uint256) public hashToIndex;

    /// @notice Emitted on every successful recordAttendance call.
    /// @param student        msg.sender for the transaction.
    /// @param attendanceHash The hash committed on-chain.
    /// @param timestamp      Block timestamp of inclusion.
    /// @param recordIndex    Position within `records`.
    event AttendanceRecorded(
        address indexed student,
        bytes32 attendanceHash,
        uint256 timestamp,
        uint256 recordIndex
    );

    /// @notice Commits a new attendance hash to the ledger.
    /// @dev Reverts if the same hash has already been recorded.
    /// @param _attendanceHash keccak256 digest produced by the backend.
    function recordAttendance(bytes32 _attendanceHash) public {
        require(!hashExists[_attendanceHash], "Attendance already recorded");

        uint256 index = records.length;
        records.push(Record({
            student: msg.sender,
            attendanceHash: _attendanceHash,
            timestamp: block.timestamp
        }));

        hashExists[_attendanceHash] = true;
        hashToIndex[_attendanceHash] = index;

        emit AttendanceRecorded(msg.sender, _attendanceHash, block.timestamp, index);
    }

    /// @notice Look up a hash and return the originating address + timestamp.
    /// @param _attendanceHash Hash to verify.
    /// @return exists    True iff the hash has been recorded.
    /// @return student   Address that submitted the record (zero if absent).
    /// @return timestamp Block timestamp of inclusion (zero if absent).
    function verifyAttendance(bytes32 _attendanceHash) public view returns (bool exists, address student, uint256 timestamp) {
        if (!hashExists[_attendanceHash]) {
            return (false, address(0), 0);
        }
        uint256 index = hashToIndex[_attendanceHash];
        Record memory r = records[index];
        return (true, r.student, r.timestamp);
    }

    /// @notice Total number of records ever committed.
    /// @return Length of the `records` array.
    function getRecordCount() public view returns (uint256) {
        return records.length;
    }

    /// @notice Fetch a record by its index in insertion order.
    /// @param _index Zero-based index into `records`.
    /// @return student        Submitter address.
    /// @return attendanceHash The committed hash.
    /// @return timestamp      Block timestamp of inclusion.
    function getRecord(uint256 _index) public view returns (address student, bytes32 attendanceHash, uint256 timestamp) {
        require(_index < records.length, "Index out of bounds");
        Record memory r = records[_index];
        return (r.student, r.attendanceHash, r.timestamp);
    }
}
