const hre = require("hardhat");

async function main() {
  const AttendanceRecord = await hre.ethers.getContractFactory("AttendanceRecord");
  const contract = await AttendanceRecord.deploy();
  await contract.deployed();

  console.log("AttendanceRecord deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });