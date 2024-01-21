// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IEtherGame {
    function deposit() external payable;

    function claimReward() external;
}
