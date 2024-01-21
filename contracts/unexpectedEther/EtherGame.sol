// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract EtherGame {
    error NotOneEtherSent();
    error GameAlreadyEnded();
    error NotTheLastDepositor();
    error GameHasntEndedYet();
    error EthTransferFailed();

    uint public targetAmount = 7 ether;
    address public lastDepositor;

    function deposit() public payable {
        if (msg.value != 1 ether) revert NotOneEtherSent();

        uint balance = address(this).balance;
        if (targetAmount <= balance) revert GameAlreadyEnded();

        lastDepositor = msg.sender;
    }

    function claimReward() public {
        uint balance = address(this).balance;
        if (targetAmount != balance) revert GameHasntEndedYet();
        if (msg.sender != lastDepositor) revert NotTheLastDepositor();

        (bool success, ) = lastDepositor.call{value: balance}("");
        if (!success) revert EthTransferFailed();
    }
}
