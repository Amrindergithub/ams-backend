const hre = require("hardhat");

async function main() {
  const AttendanceRecord = await hre.ethers.getContractFactory("AttendanceRecord");
  const attendance = await AttendanceRecord.deploy();
  await attendance.deployed();
  console.log("AttendanceRecord deployed to:", attendance.address);

  const AttendanceNFT = await hre.ethers.getContractFactory("AttendanceNFT");
  const nft = await AttendanceNFT.deploy();
  await nft.deployed();
  console.log("AttendanceNFT deployed to:", nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });