// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AttendanceRecord {
    struct Record {
        address student;
        bytes32 attendanceHash;
        uint256 timestamp;
    }

    Record[] public records;
    mapping(bytes32 => bool) public hashExists;
    mapping(bytes32 => uint256) public hashToIndex;

    event AttendanceRecorded(
        address indexed student,
        bytes32 attendanceHash,
        uint256 timestamp,
        uint256 recordIndex
    );

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

    function verifyAttendance(bytes32 _attendanceHash) public view returns (bool exists, address student, uint256 timestamp) {
        if (!hashExists[_attendanceHash]) {
            return (false, address(0), 0);
        }
        uint256 index = hashToIndex[_attendanceHash];
        Record memory r = records[index];
        return (true, r.student, r.timestamp);
    }

    function getRecordCount() public view returns (uint256) {
        return records.length;
    }

    function getRecord(uint256 _index) public view returns (address student, bytes32 attendanceHash, uint256 timestamp) {
        require(_index < records.length, "Index out of bounds");
        Record memory r = records[_index];
        return (r.student, r.attendanceHash, r.timestamp);
    }
}