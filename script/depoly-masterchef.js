const hre = require("hardhat");

async function main() {
  let signers = await ethers.getSigners()
  let alice = signers[0]

  // heshi token 
  const HeshiToken = await hre.ethers.getContractFactory("HeshiToken");
  const heshiToken = await HeshiToken.deploy();
  await heshiToken.deployed();
  console.log("HeshiToken deployed to:", heshiToken.address);

  // masterChef
  const MasterChef = await hre.ethers.getContractFactory("MasterChef");
  const masterChef = await MasterChef.deploy(heshiToken.address, alice.address, "1000", "100");
  await masterChef.deployed();
  console.log("MasterChef deployed to:", masterChef.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
