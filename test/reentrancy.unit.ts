import { expect } from "chai";
import { ethers } from "hardhat";
import { ReentrancyDrainer } from "../typechain/contracts/reentrancy/ReentrancyDrainer";
import { VaultReentrancyVulnerable } from "../typechain/contracts/reentrancy/VaultReentrancyVulnerable";
import { VaultReentrancyVulnerableProtected } from "../typechain/contracts/reentrancy/VaultReentrancyVulnerableProtected";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  VaultReentrancyVulnerable__factory,
  ReentrancyDrainer__factory,
  VaultReentrancyVulnerableProtected__factory,
} from "../typechain/factories/contracts/reentrancy";

describe("reentrancy", () => {
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  let vulnerableVault: VaultReentrancyVulnerable;
  let drainer: ReentrancyDrainer;

  beforeEach(async () => {
    [deployer, attacker] = await ethers.getSigners();

    vulnerableVault = await new VaultReentrancyVulnerable__factory(
      deployer
    ).deploy();
    drainer = await new ReentrancyDrainer__factory(attacker).deploy(
      vulnerableVault.address
    );
  });

  describe("Attack", () => {
    it("Should drain funds from the vulnerable vault", async () => {
      const depositAmount = ethers.utils.parseEther("1");

      // Check attacker balance before attack
      const attackerBalanceBefore = await ethers.provider.getBalance(
        attacker.address
      );

      // Drainer contract deposits funds into the vulnerable vault
      await drainer.connect(deployer).deposit({ value: depositAmount });
      // Check vault balance
      expect(await vulnerableVault.connect(deployer).balance()).to.equal(
        depositAmount
      );

      // Drainer withdraws funds recursively
      await drainer.connect(deployer).withdraw();

      // Check vault balance is zero
      expect(await vulnerableVault.connect(deployer).balance()).to.equal(0);

      // Check drainer ETH balance
      expect(await ethers.provider.getBalance(drainer.address)).to.equal(0);

      // Check attacker balance after attack
      const attackerBalanceAfter = await ethers.provider.getBalance(
        attacker.address
      );

      // Check attacker ETH balance received drained funds
      expect(attackerBalanceAfter).to.be.equal(
        attackerBalanceBefore.add(depositAmount)
      );
    });
  });

  describe("Protection", () => {
    let vulnerableVaultProtected: VaultReentrancyVulnerableProtected;
    let drainerProtected: ReentrancyDrainer;
    let user: SignerWithAddress;

    beforeEach(async () => {
      [user] = await ethers.getSigners();
      vulnerableVaultProtected =
        await new VaultReentrancyVulnerableProtected__factory(
          deployer
        ).deploy();
      drainerProtected = await new ReentrancyDrainer__factory(attacker).deploy(
        vulnerableVaultProtected.address
      );
    });

    it("Should fail the attack with an error EthTransferFailed", async () => {
      const depositAmount = ethers.utils.parseEther("1");

      // Drainer contract deposits funds into the vulnerable vault
      await vulnerableVaultProtected
        .connect(user)
        .deposit({ value: depositAmount });

      // Check vault balance
      expect(await vulnerableVaultProtected.connect(user).balance()).to.equal(
        depositAmount
      );

      // Perform the withdraw function that should trigger reentrancy attack
      await expect(
        drainerProtected.connect(user).withdraw()
      ).to.be.revertedWithCustomError(
        vulnerableVaultProtected,
        "EthTransferFailed"
      );
    });

    it("Should deposit and withdraw funds", async () => {
      const depositAmount = ethers.utils.parseEther("1");

      // Drainer deposits funds into the vault
      await drainerProtected.connect(user).deposit({ value: depositAmount });

      // Check vault balance
      expect(await vulnerableVaultProtected.balance()).to.equal(depositAmount);

      // Drainer withdraws funds recursively
      await drainerProtected.connect(user).withdraw();

      // Check vault balance after withdraw
      expect(await vulnerableVaultProtected.balance()).to.equal(0);

      // User withdraws funds
      await vulnerableVaultProtected.connect(user).withdraw();

      // Check vault empty
      expect(await vulnerableVaultProtected.balance()).to.equal(0);
    });
  });
});
