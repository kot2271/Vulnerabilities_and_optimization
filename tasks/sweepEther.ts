import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { AcademyV2 } from "../typechain";

task("sweepEther", "Transfers all contract's balance to a specified address")
  .addParam("contract", "The address of the AcademyV2 contract")
  .addParam("to", "The address to transfer the Ether to")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const academy: AcademyV2 = <AcademyV2>(
        await hre.ethers.getContractAt("AcademyV2", taskArgs.contract as string)
      );

      const addressToSweep: string = taskArgs.to;

      await academy.sweepEther(addressToSweep);

      const filter = academy.filters.EtherSwept();
      const events = await academy.queryFilter(filter);
      const txAddressTo = events[0].args["to"];
      const txamount = events[0].args["amount"];

      const ethAmount = hre.ethers.utils.formatEther(txamount);

      console.log(`Swept ${ethAmount} ETH to ${txAddressTo}`);
    }
  );
