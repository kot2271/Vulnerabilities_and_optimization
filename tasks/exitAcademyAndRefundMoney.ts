import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { AcademyV2 } from "../typechain";

task(
  "exitAcademyAndRefundMoney",
  "Allows a student to exit the academy and get a refund"
)
  .addParam("contract", "The address of the AcademyV2 contract")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const academy: AcademyV2 = <AcademyV2>(
        await hre.ethers.getContractAt("AcademyV2", taskArgs.contract as string)
      );

      await academy.exitAcademyAndRefundMoney();

      const filter = academy.filters.StudentExited();
      const events = await academy.queryFilter(filter);
      const txStudentAccount = events[0].args["studentAccount"];
      const txAmountRefunded = events[0].args["amountRefunded"];

      const amountRefunded = hre.ethers.utils.formatEther(txAmountRefunded);

      console.log(
        `Student ${txStudentAccount} exited the academy and refund ${amountRefunded} ETH`
      );
    }
  );
