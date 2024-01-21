import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { AcademyV2 } from "../typechain";
import { BigNumberish } from "ethers";

task("addStudent", "Registers a new student in the Academy")
  .addParam("contract", "The address of the AcademyV2 contract")
  .addParam("name", "The name of the student")
  .addParam("age", "The age of the student")
  .addParam("studentAccount", "The account address of the student")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const academy: AcademyV2 = <AcademyV2>(
        await hre.ethers.getContractAt("AcademyV2", taskArgs.contract as string)
      );

      const name: string = taskArgs.name;
      const age: BigNumberish = taskArgs.age;
      const studentAccount: string = taskArgs.studentAccount;

      await academy.addStudent(name, age, studentAccount);

      const student = await academy.students(studentAccount);
      const studentAddress: string = student.studentAccount;

      console.log(`Student with account address ${studentAddress} added`);
    }
  );
