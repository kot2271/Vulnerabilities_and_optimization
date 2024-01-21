// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IVaultTxOrigin {
    function withdraw(address to, uint256 amount) external;
}
