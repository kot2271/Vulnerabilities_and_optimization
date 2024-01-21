import { expect } from "chai";
import { ethers } from "hardhat";
import { EtherGame } from "../typechain/contracts/unexpectedEther/EtherGame";
import { EtherGameProtected } from "../typechain/contracts/unexpectedEther/EtherGameProtected";
import { SelfDestructAttack } from "../typechain/contracts/unexpectedEther/SelfDestructAttack";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";

describe("unexpectedEther", () => {
  let etherGame: EtherGame;
  let selfDestructAttack: SelfDestructAttack;
  let owner: SignerWithAddress;
  let attacker: SignerWithAddress;
  let otherPlayer: SignerWithAddress;
  let oneEther: BigNumber;

  beforeEach(async () => {
    // Get signers
    [owner, attacker, otherPlayer] = await ethers.getSigners();

    // Deploy EtherGame contract
    const EtherGameFactory = await ethers.getContractFactory("EtherGame");
    etherGame = await EtherGameFactory.deploy();
    await etherGame.deployed();

    oneEther = ethers.utils.parseEther("1");

    // Deploy SelfDestructAttack contract with attacker as the owner
    const SelfDestructAttackFactory = await ethers.getContractFactory(
      "SelfDestructAttack"
    );
    selfDestructAttack = await SelfDestructAttackFactory.connect(
      attacker
    ).deploy(etherGame.address, { value: oneEther });
    await selfDestructAttack.deployed();
  });

  describe("Attack", () => {
    it("Should be a receipt of the full consideration after the contract is sent an unexpected ether.", async () => {
      // Checking the balance of the attacker before the attack
      const attackerBalanceBefore = await ethers.provider.getBalance(
        attacker.address
      );

      // Other players make their deposits
      for (let i = 0; i < 5; i++) {
        await etherGame.connect(otherPlayer).deposit({ value: oneEther });
      }
      // Attacker makes a deposit to be the last one.
      await etherGame.connect(attacker).deposit({ value: oneEther });

      // Attacker triggers selfdestruct, sending its balance to the EtherGame contract
      await selfDestructAttack.connect(attacker).selfDestructAttack();

      // Attempt to claim the reward
      await etherGame.connect(attacker).claimReward();

      // Checking the attacker's balance after an attack
      const attackerBalanceAfter = await ethers.provider.getBalance(
        attacker.address
      );

      // Verify that the EtherGame contract's balance includes the unexpected ether
      expect(attackerBalanceAfter).to.be.gt(
        attackerBalanceBefore.add(ethers.utils.parseEther("5.99"))
      );
    });
  });

  describe("Protection", () => {
    let etherGameProtected: EtherGameProtected;
    let player1: SignerWithAddress;
    let player2: SignerWithAddress;

    beforeEach(async () => {
      [player1, player2] = await ethers.getSigners();

      // Deploy EtherGameProtected contract
      const EtherGameProtectedFactory = await ethers.getContractFactory(
        "EtherGameProtected"
      );
      etherGameProtected = await EtherGameProtectedFactory.deploy();
      await etherGameProtected.deployed();
    });

    it("Should fail the attack with an error 'GameHasntEndedYet'", async () => {
      // Other players make their deposits
      for (let i = 0; i < 5; i++) {
        await etherGameProtected
          .connect(otherPlayer)
          .deposit({ value: oneEther });
      }
      // Attacker makes a deposit to be the last one.
      await etherGameProtected.connect(attacker).deposit({ value: oneEther });

      // Attacker triggers selfdestruct, sending its balance to the EtherGame contract
      await selfDestructAttack.connect(attacker).selfDestructAttack();

      // Attempt to claim the reward
      await expect(
        etherGameProtected.connect(attacker).claimReward()
      ).to.be.revertedWithCustomError(etherGameProtected, "GameHasntEndedYet");
    });

    it("should allow deposits and payout", async function () {
      // Player 1 deposits 4 ETH
      for (let i = 0; i < 5; i++) {
        await etherGameProtected.connect(player1).deposit({ value: oneEther });
      }

      // Check balance increased by 4 ETH
      expect(
        await ethers.provider.getBalance(etherGameProtected.address)
      ).to.equal(ethers.utils.parseEther("5"));

      // Player 2 deposits 1 ETH
      await etherGameProtected.connect(player2).deposit({ value: oneEther });

      // Check total balance is 6 ETH
      expect(
        await ethers.provider.getBalance(etherGameProtected.address)
      ).to.equal(ethers.utils.parseEther("6"));

      // Player 2 claims reward
      await expect(
        etherGameProtected.connect(player2).claimReward()
      ).to.be.revertedWithCustomError(etherGameProtected, "GameHasntEndedYet");
    });
  });
});
