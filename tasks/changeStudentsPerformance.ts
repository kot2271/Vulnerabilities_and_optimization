import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { AcademyV2 } from "../typechain";
import { BigNumberish } from "ethers";

task(
  "changeStudentsPerformance",
  "Updates a student's performance and completion percent"
)
  .addParam("contract", "The address of the AcademyV2 contract")
  .addParam("studentAccount", "The account address of the student")
  .addParam("newMark", "The new mark to add to the student's record")
  .addParam("completionPercent", "The new completion percentage of the student")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const academy: AcademyV2 = <AcademyV2>(
        await hre.ethers.getContractAt("AcademyV2", taskArgs.contract as string)
      );

      const studentAccount: string = taskArgs.studentAccount;
      const newMark: BigNumberish = taskArgs.newMark;
      const completionPercent: BigNumberish = taskArgs.completionPercent;

      await academy.changeStudentsPerformance(
        studentAccount,
        newMark,
        completionPercent
      );

      const student = await academy.students(studentAccount);
      const studentAddress: string = student.studentAccount;
      const studentCompletionPercent = await academy.completionPercent(
        studentAddress
      );

      console.log(`Performance of student ${studentAddress} updated`);
      console.log(`Added new mark: ${newMark}`);
      console.log(`New completion percentage: ${studentCompletionPercent}`);
    }
  );
