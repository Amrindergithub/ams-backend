const router = require("express").Router();
const { internalServerError } = require("../utils/response");
const nft = require("../services/nft");
const StudentProfile = require("../models/student_profile");

// POST - Mint NFT certificate for a student
router.post("/mint", async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: "failed",
        message: "studentId is required",
      });
    }

    const student = await StudentProfile.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    if (!student.walletAddress) {
      return res.status(400).json({
        status: "failed",
        message: "Student has no wallet address registered. They must connect MetaMask first.",
      });
    }

    const tier = nft.getEligibleTier(student.totalCheckIns);
    if (!tier) {
      return res.status(400).json({
        status: "failed",
        message: `Student needs at least ${nft.TIERS[0].threshold} check-ins to earn a certificate. Current: ${student.totalCheckIns}`,
      });
    }

    const result = await nft.mintCertificate(
      student.walletAddress,
      studentId,
      tier.name,
      student.totalCheckIns
    );

    return res.status(201).json({
      status: "success",
      message: `${tier.name} certificate minted to ${student.walletAddress}!`,
      data: {
        ...result,
        tier: tier.name,
        sessionsAttended: student.totalCheckIns,
        walletAddress: student.walletAddress,
      },
    });
  } catch (error) {
    if (error.message?.includes("already has this tier")) {
      return res.status(400).json({
        status: "failed",
        message: "Student already has this tier certificate",
      });
    }
    internalServerError(res, error);
  }
});

// GET - Get certificates for a student by wallet address
router.get("/student/:walletAddress", async (req, res) => {
  try {
    const certs = await nft.getStudentCertificates(req.params.walletAddress);
    return res.status(200).json({
      status: "success",
      data: { certificates: certs },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Get certificate by token ID
router.get("/certificate/:tokenId", async (req, res) => {
  try {
    const cert = await nft.getCertificate(req.params.tokenId);
    return res.status(200).json({
      status: "success",
      data: { certificate: cert },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

// GET - Tiers info
router.get("/tiers", async (req, res) => {
  try {
    const totalMinted = await nft.getTotalMinted();
    return res.status(200).json({
      status: "success",
      data: {
        tiers: nft.TIERS,
        totalMinted,
      },
    });
  } catch (error) {
    internalServerError(res, error);
  }
});

module.exports = router;