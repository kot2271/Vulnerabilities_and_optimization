import { expect } from "chai";
import { ethers } from "hardhat";
import { EOAPretender } from "../typechain/contracts/contractCodeSizeZero/EOAPretender";
import { VaultForEOA } from "../typechain/contracts/contractCodeSizeZero/VaultForEOA";
import { VaultForEOAProtected } from "../typechain/contracts/contractCodeSizeZero/VaultForEOAProtected";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  VaultForEOA__factory,
  EOAPretender__factory,
  VaultForEOAProtected__factory,
} from "../typechain";

describe("contractCodeSizeZero", () => {
  let vault: VaultForEOA;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    [attacker, deployer] = await ethers.getSigners();

    vault = await new VaultForEOA__factory(deployer).deploy();
  });

  describe("Attack", () => {
    it("Should drain funds from VaultForEOA", async () => {
      const tenEther = ethers.utils.parseEther("10");

      await deployer.sendTransaction({
        to: vault.address,
        value: tenEther,
      });

      expect(await ethers.provider.getBalance(vault.address)).to.equal(
        tenEther
      );

      const attackerBalanceBefore = await ethers.provider.getBalance(
        attacker.address
      );

      const eoapretender: EOAPretender = await new EOAPretender__factory(
        attacker
      ).deploy(vault.address);

      const attackerBalanceAfter = await ethers.provider.getBalance(
        attacker.address
      );

      expect(attackerBalanceAfter).to.be.gt(
        attackerBalanceBefore.add(ethers.utils.parseEther("9.99"))
      );
      expect(await ethers.provider.getBalance(vault.address)).to.equal(0);
    });
  });

  describe("Protection", () => {
    let vaultProtected: VaultForEOAProtected;
    let user: SignerWithAddress;

    beforeEach(async () => {
      [user] = await ethers.getSigners();
      vaultProtected = await new VaultForEOAProtected__factory(
        attacker
      ).deploy();
    });

    it("Should fail the attack with an error 'CallerIsContract'", async () => {
      await expect(
        new EOAPretender__factory(attacker).deploy(vaultProtected.address)
      ).to.be.revertedWithCustomError(vaultProtected, "CallerIsContract");
    });

    it("Should allow withdrawal from origin", async () => {
      const initialBalance = ethers.utils.parseEther("1");

      await user.sendTransaction({
        to: vaultProtected.address,
        value: initialBalance,
      });

      expect(await ethers.provider.getBalance(vaultProtected.address)).to.equal(
        initialBalance
      );

      await expect(
        vaultProtected.connect(user).grabMoneyIfNotAContract()
      ).to.changeEtherBalance(user, initialBalance);

      const filter = vaultProtected.filters.MoneyGrabbed();
      const events = await vaultProtected.queryFilter(filter);

      const txSender = events[0].args["sender"];
      const txAmount = events[0].args["amount"];

      expect(txSender).to.equal(user.address);
      expect(txAmount).to.equal(initialBalance);

      expect(await ethers.provider.getBalance(vaultProtected.address)).to.equal(
        0
      );
    });
  });
});
