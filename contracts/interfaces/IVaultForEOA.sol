// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IVaultForEOA {
    function isContract(address account) external view returns (bool);

    function grabMoneyIfNotAContract() external;
}
