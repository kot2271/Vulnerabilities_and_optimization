import { getNamedAccounts, deployments, ethers } from "hardhat";
import { verify } from "../helpers/verify";

const CONTRACT_NAME = "AcademyV2";
const EDUCATION_PRICE = ethers.utils.parseEther("1");

async function deployFunction() {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [EDUCATION_PRICE];
  const academy = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: 6,
  });
  console.log(`${CONTRACT_NAME} deployed at: ${academy.address}`);
  await verify(academy.address, args);
}

deployFunction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
