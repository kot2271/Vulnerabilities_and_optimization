// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IVaultReentrancyAttack {
    function deposit() external payable;

    function withdraw() external;

    function balance() external view returns (uint256);
}
