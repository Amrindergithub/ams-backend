const { ethers } = require("ethers");
const contractABI = require("../../../build/contracts/AttendanceRecord.json").abi;

const provider = new ethers.providers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");

// Uses the first Ganache account to send transactions from the backend
const signer = provider.getSigner(0);

const getContract = () => {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not set in .env");
  }
  return new ethers.Contract(contractAddress, contractABI, signer);
};

const generateAttendanceHash = (studentId, courseId, date) => {
  return ethers.utils.solidityKeccak256(
    ["string", "string", "string"],
    [studentId, courseId, date]
  );
};

const recordOnChain = async (attendanceHash) => {
  const contract = getContract();
  const tx = await contract.recordAttendance(attendanceHash);
  const receipt = await tx.wait();
  return {
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  };
};

const verifyOnChain = async (attendanceHash) => {
  const contract = getContract();
  const result = await contract.verifyAttendance(attendanceHash);
  return {
    exists: result.exists,
    student: result.student,
    timestamp: result.timestamp.toString(),
  };
};

const getRecordCount = async () => {
  const contract = getContract();
  const count = await contract.getRecordCount();
  return count.toString();
};

module.exports = {
  generateAttendanceHash,
  recordOnChain,
  verifyOnChain,
  getRecordCount,
};