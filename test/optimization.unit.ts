import { expect } from "chai";
import { ethers } from "hardhat";
import { AcademyV2 } from "../typechain/contracts/optimization/AcademyV2";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("AcademyV2", () => {
  let academy: AcademyV2;
  let admin: SignerWithAddress;
  let student: SignerWithAddress;
  let nonAdmin: SignerWithAddress;
  const educationPrice = ethers.utils.parseEther("1");

  beforeEach(async () => {
    [admin, student, nonAdmin] = await ethers.getSigners();
    const AcademyV2Factory = await ethers.getContractFactory(
      "AcademyV2",
      admin
    );
    academy = await AcademyV2Factory.deploy(educationPrice);
    await academy.deployed();
  });

  describe("deployment", () => {
    it("Sets admin role", async () => {
      expect(await academy.hasRole(await academy.ADMIN_ROLE(), admin.address))
        .to.be.true;
    });
  });

  describe("addStudent", () => {
    it("Should allow admin to add a student", async () => {
      await expect(
        academy.connect(admin).addStudent("Alice", 20, student.address)
      )
        .to.emit(academy, "StudentAdded")
        .withArgs(student.address);

      const addedStudent = await academy.students(student.address);
      expect(addedStudent.name).to.eq("Alice");
    });

    it("Should not allow non-admin to add a student", async () => {
      await expect(
        academy.connect(nonAdmin).addStudent("Bob", 21, student.address)
      ).to.be.revertedWith(
        `AccessControl: account ${nonAdmin.address.toLowerCase()} is missing role ${await academy.ADMIN_ROLE()}`
      );
    });

    it("Should not allow adding a same student", async () => {
      await academy.connect(admin).addStudent("Alice", 20, student.address);
      await expect(
        academy.connect(admin).addStudent("Alice", 20, student.address)
      ).to.be.revertedWith("Student already registered.");
    });
  });

  describe("payAndEnterAcademy", () => {
    it("Should allow a student to pay and enter the academy", async () => {
      await expect(
        academy
          .connect(student)
          .payAndEnterAcademy("Alice", 20, student.address, {
            value: educationPrice,
          })
      )
        .to.emit(academy, "StudentAdded")
        .withArgs(student.address);

      const addedStudent = await academy.students(student.address);
      expect(addedStudent.name).to.eq("Alice");
      expect(addedStudent.activeStatus).to.eq(1);
    });

    it("Should fail if the wrong amount is paid", async () => {
      await expect(
        academy
          .connect(student)
          .payAndEnterAcademy("Alice", 20, student.address, {
            value: educationPrice.div(2),
          })
      ).to.be.revertedWith("Not enough ether sent, to pay for education.");

      const addedStudent = await academy.students(student.address);
      expect(addedStudent.name).to.not.eq("Alice");
    });

    it("Should fail if adding the same student", async () => {
      await academy
        .connect(admin)
        .payAndEnterAcademy("Bob", 21, student.address, {
          value: educationPrice,
        });
      await expect(
        academy.connect(admin).payAndEnterAcademy("Bob", 21, student.address, {
          value: educationPrice,
        })
      ).to.be.revertedWith("Student already registered.");
    });
  });

  describe("exitAcademyAndRefundMoney", () => {
    it("Should allows active student to exit and refund", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Bob", 21, student.address, {
          value: educationPrice,
        });

      await expect(academy.connect(student).exitAcademyAndRefundMoney())
        .to.emit(academy, "StudentExited")
        .withArgs(student.address, educationPrice);

      const stdnt = await academy.students(student.address);
      expect(stdnt.activeStatus).to.eq(0); // Inactive
    });

    it("Should return a percentage of the completed training program", async () => {
      await academy
        .connect(admin)
        .payAndEnterAcademy("Bob", 21, student.address, {
          value: educationPrice,
        });
      await academy
        .connect(admin)
        .changeStudentsPerformance(student.address, 10, 40);
      await academy
        .connect(admin)
        .changeStudentsPerformance(student.address, 8, 70);

      const studentBalanceBefore = await student.getBalance();

      await academy.connect(student).exitAcademyAndRefundMoney();

      const studentBalanceAfter = await student.getBalance();

      expect(studentBalanceAfter).to.be.gt(
        studentBalanceBefore.add(ethers.utils.parseEther("0.9929"))
      );
    });

    it("Should rejects exiting for non-existing student", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Bob", 21, student.address, {
          value: educationPrice,
        });

      await expect(
        academy.connect(nonAdmin).exitAcademyAndRefundMoney()
      ).to.be.revertedWith("Student doesn't exist!");
    });

    it("Should rejects exiting for already inactive student", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Alice", 20, student.address, {
          value: educationPrice,
        });
      await academy
        .connect(admin)
        .changeStudentsPerformance(student.address, 10, 100);

      await expect(
        academy.connect(student).exitAcademyAndRefundMoney()
      ).to.be.revertedWith("Student already inactive.");
    });

    it("Should emit event with zero amount on exit if student has not paid", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);
      const addedStudent = await academy.students(student.address);
      expect(addedStudent.paymentStatus).to.eq(0);
      await expect(academy.connect(student).exitAcademyAndRefundMoney())
        .to.be.emit(academy, "StudentExited")
        .withArgs(student.address, 0);
    });
  });

  describe("changeStudentsPerformance", () => {
    it("Should allows admin to change student perfomance", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);

      await expect(
        academy
          .connect(admin)
          .changeStudentsPerformance(student.address, 10, 60)
      )
        .to.emit(academy, "PerformanceChanged")
        .withArgs(student.address, 10, 60);

      expect(await academy.marks(student.address, 0)).to.eq(10);
      expect(await academy.completionPercent(student.address)).to.be.eq(60);
    });

    it("Should fail if student does not exist ", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);
      await expect(
        academy
          .connect(admin)
          .changeStudentsPerformance(nonAdmin.address, 10, 30)
      ).to.be.revertedWith("Student doesn't exist!");
    });

    it("Should fail if non admin tries to change student perfomance", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);
      await expect(
        academy
          .connect(nonAdmin)
          .changeStudentsPerformance(student.address, 10, 50)
      ).to.be.revertedWith(
        `AccessControl: account ${nonAdmin.address.toLowerCase()} is missing role ${await academy.ADMIN_ROLE()}`
      );
    });
  });

  describe("sweepEther", () => {
    it("Should allows admin to sweep ether", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Alice", 20, student.address, {
          value: educationPrice,
        });

      const adminBalanceBefore = await admin.getBalance();

      await expect(academy.connect(admin).sweepEther(admin.address))
        .to.emit(academy, "EtherSwept")
        .withArgs(admin.address, educationPrice);

      const adminBalanceAfter = await admin.getBalance();
      expect(adminBalanceAfter).to.be.gt(
        adminBalanceBefore.add(ethers.utils.parseEther("0.99"))
      );
    });

    it("Should fail if non admin tries to sweep ether", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Alice", 20, student.address, {
          value: educationPrice,
        });
      await expect(
        academy.connect(nonAdmin).sweepEther(admin.address)
      ).to.be.revertedWith(
        `AccessControl: account ${nonAdmin.address.toLowerCase()} is missing role ${await academy.ADMIN_ROLE()}`
      );
    });

    it("Should fail if address to sweep is zero", async () => {
      await academy
        .connect(student)
        .payAndEnterAcademy("Alice", 20, student.address, {
          value: educationPrice,
        });

      await expect(
        academy.connect(admin).sweepEther(ethers.constants.AddressZero)
      ).to.be.revertedWith("Address 'to' cannot be zero.");
    });

    it("Should fail if contract balance is zero", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);
      await expect(
        academy.connect(admin).sweepEther(admin.address)
      ).to.be.revertedWith("No ether to sweep.");
    });
  });

  describe("getAvgRatingOfStudent", () => {
    it("Should calculates student average rating", async () => {
      await academy.connect(admin).addStudent("Bob", 21, student.address);
      await academy
        .connect(admin)
        .changeStudentsPerformance(student.address, 10, 40);
      await academy
        .connect(admin)
        .changeStudentsPerformance(student.address, 8, 70);

      const avg = await academy.getAvgRatingOfStudent(student.address);
      expect(avg).to.eq(90000); // ((10 + 8) * 10.000) / 2
    });
  });

  it("Should reverts for non-existing student", async () => {
    await expect(
      academy.getAvgRatingOfStudent(student.address)
    ).to.be.revertedWith("Student doesn't exist");
  });

  it("Should reverts if no marks", async () => {
    await academy.connect(admin).addStudent("Alice", 20, student.address);

    await expect(
      academy.getAvgRatingOfStudent(student.address)
    ).to.be.revertedWith("No marks to calculate average");
  });
});
