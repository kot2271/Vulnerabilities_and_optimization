import { expect } from "chai";
import { ethers } from "hardhat";
import { FishingContract } from "../typechain/contracts/tx-origin/FishingContract";
import { VaultTxOrigin } from "../typechain/contracts/tx-origin/VaultTxOrigin";
import { VaultTxOriginProtected } from "../typechain/contracts/tx-origin/VaultTxOriginProtected";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("tx-origin", () => {
  let owner: SignerWithAddress;
  let attacker: SignerWithAddress;
  let fishingContract: FishingContract;
  let vaultTxOrigin: VaultTxOrigin;
  let initialAmount: BigNumber;

  beforeEach(async () => {
    // Get signers
    [owner, attacker] = await ethers.getSigners();

    initialAmount = ethers.utils.parseEther("1");

    // Deploy VaultTxOrigin with some Ether
    const VaultTxOriginFactory = await ethers.getContractFactory(
      "VaultTxOrigin",
      owner
    );
    vaultTxOrigin = await VaultTxOriginFactory.deploy(owner.address);
    await owner.sendTransaction({
      to: vaultTxOrigin.address,
      value: initialAmount,
    });

    // Deploy FishingContract
    const FishingContractFactory = await ethers.getContractFactory(
      "FishingContract",
      attacker
    );
    fishingContract = await FishingContractFactory.deploy(
      attacker.address,
      vaultTxOrigin.address
    );
  });

  describe("Attack", () => {
    it("should allow attacker to withdraw funds from the vault via tx-origin attack", async () => {
      const attackerBalanceBefore = await ethers.provider.getBalance(
        attacker.address
      );
      // Attacker sends transaction to FishingContract to trigger the attack
      await fishingContract.connect(owner).getFreeMoney();

      // Check balance of attacker to make sure it increased by the vault's balance
      const attackerBalanceAfter = await ethers.provider.getBalance(
        attacker.address
      );
      expect(attackerBalanceAfter).to.be.equal(
        attackerBalanceBefore.add(initialAmount)
      );
    });
  });

  describe("Protection", () => {
    let vaultTxOriginProtected: VaultTxOriginProtected;
    let fishingContractProtected: FishingContract;

    beforeEach(async () => {
      // Deploy VaultTxOriginProtected with some Ether
      const VaultTxOriginFactory = await ethers.getContractFactory(
        "VaultTxOriginProtected",
        owner
      );
      vaultTxOriginProtected = await VaultTxOriginFactory.connect(
        owner
      ).deploy();
      await owner.sendTransaction({
        to: vaultTxOrigin.address,
        value: initialAmount,
      });

      // Deploy FishingContract with VaultTxOriginProtected
      const FishingContractFactory = await ethers.getContractFactory(
        "FishingContract",
        attacker
      );
      fishingContractProtected = await FishingContractFactory.deploy(
        attacker.address,
        vaultTxOriginProtected.address
      );
    });

    it("Should fail the attack with an error NotAnOwner", async () => {
      await expect(
        fishingContractProtected.connect(owner).getFreeMoney()
      ).to.be.revertedWithCustomError(vaultTxOriginProtected, "NotAnOwner");
    });

    it("Should allow owner to withdraw funds", async () => {
      await owner.sendTransaction({
        to: vaultTxOriginProtected.address,
        value: initialAmount,
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      // Owner withdraws funds
      const withdrawAmount = ethers.utils.parseEther("0.5");
      await vaultTxOriginProtected
        .connect(owner)
        .withdraw(owner.address, withdrawAmount);

      // Check owner's balance increased
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.gt(ownerBalanceBefore);

      // Check contract balance decreased
      const contractBalance = await ethers.provider.getBalance(
        vaultTxOriginProtected.address
      );
      expect(contractBalance).to.equal(initialAmount.sub(withdrawAmount));
    });
  });
});
