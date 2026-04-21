const { ethers } = require("ethers");
const contractABI = require("../../../build/contracts/AttendanceNFT.json").abi;

const provider = new ethers.providers.JsonRpcProvider(process.env.GANACHE_URL || "http://127.0.0.1:7545");
const signer = provider.getSigner(0);

const TIERS = [
  { name: "Bronze", threshold: 5 },
  { name: "Silver", threshold: 15 },
  { name: "Gold", threshold: 30 },
  { name: "Platinum", threshold: 50 },
];

const getContract = () => {
  const address = process.env.NFT_CONTRACT_ADDRESS;
  if (!address) throw new Error("NFT_CONTRACT_ADDRESS not set in .env");
  return new ethers.Contract(address, contractABI, signer);
};

const getEligibleTier = (sessionsAttended) => {
  let eligible = null;
  for (const tier of TIERS) {
    if (sessionsAttended >= tier.threshold) {
      eligible = tier;
    }
  }
  return eligible;
};

const mintCertificate = async (studentAddress, studentId, tier, sessionsAttended) => {
  const contract = getContract();
  const tx = await contract.mintCertificate(studentAddress, studentId, tier, sessionsAttended);
  const receipt = await tx.wait();

  const event = receipt.events?.find((e) => e.event === "CertificateMinted");
  const tokenId = event?.args?.tokenId?.toString();

  return {
    tokenId,
    txHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber,
  };
};

const getCertificate = async (tokenId) => {
  const contract = getContract();
  const cert = await contract.getCertificate(tokenId);
  return {
    student: cert.student,
    studentId: cert.studentId,
    tier: cert.tier,
    sessionsAttended: cert.sessionsAttended.toString(),
    issuedAt: cert.issuedAt.toString(),
  };
};

const getStudentCertificates = async (studentAddress) => {
  const contract = getContract();
  const tokenIds = await contract.getStudentCertificates(studentAddress);
  const certs = [];
  for (const id of tokenIds) {
    const cert = await getCertificate(id.toString());
    certs.push({ tokenId: id.toString(), ...cert });
  }
  return certs;
};

const getTotalMinted = async () => {
  const contract = getContract();
  const total = await contract.getTotalMinted();
  return total.toString();
};

// Walk all minted tokens and tally by tier. Cheap on a Ganache dev chain
// but should be replaced by an event-log scan for any production deployment.
const getTierBreakdown = async () => {
  const contract = getContract();
  const total = parseInt((await contract.getTotalMinted()).toString(), 10);
  const counts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  for (let i = 0; i < total; i++) {
    try {
      const cert = await contract.getCertificate(i);
      if (counts[cert.tier] !== undefined) counts[cert.tier] += 1;
    } catch (e) {
      // skip
    }
  }
  return { total, counts };
};

module.exports = {
  TIERS,
  getEligibleTier,
  mintCertificate,
  getCertificate,
  getStudentCertificates,
  getTotalMinted,
  getTierBreakdown,
};