const AttendanceRecord = artifacts.require("AttendanceRecord");
const AttendanceNFT = artifacts.require("AttendanceNFT");

module.exports = async function (deployer) {
  await deployer.deploy(AttendanceRecord);
  const attendance = await AttendanceRecord.deployed();
  console.log("AttendanceRecord deployed to:", attendance.address);

  await deployer.deploy(AttendanceNFT);
  const nft = await AttendanceNFT.deployed();
  console.log("AttendanceNFT deployed to:", nft.address);
};
