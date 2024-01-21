import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { AcademyV2 } from "../typechain";
import { BigNumberish } from "ethers";

task("checkAddedStudent", "Checks if a student has been added")
  .addParam("contract", "The address of the AcademyV2 contract")
  .addParam("studentAccount", "The account address of the student")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const academy: AcademyV2 = <AcademyV2>(
        await hre.ethers.getContractAt("AcademyV2", taskArgs.contract as string)
      );

      const studentAccount: string = taskArgs.studentAccount;

      const student = await academy.students(studentAccount);

    //   const studentMarks = await academy.marks(studentAccount, [0, 1]);

      const studentCompletionPercent = await academy.completionPercent(
        studentAccount
      );

      const name: string = student.name;
      const age: BigNumberish = student.age;
      const activeStatus: number = student.activeStatus;
      const studentAddress: string = student.studentAccount;
      const paymentStatus: number = student.paymentStatus;
      console.log(`Student name: ${name}`);
      console.log(`Student age: ${age}`);
      console.log(`Student active status: ${activeStatus}`);
      console.log(`Student account address: ${studentAddress}`);
      console.log(`Student payment status: ${paymentStatus}`);
    //   console.log(`Student marks: ${studentMarks}`);
      console.log(`Student completion percent: ${studentCompletionPercent}`);
    }
  );
