// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract EtherGameProtected {
    error NotOneEtherSent();
    error GameAlreadyEnded();
    error NotTheLastDepositor();
    error GameHasntEndedYet();
    error EthTransferFailed();

    uint public constant TARGET_AMOUNT = 7 ether;
    uint private balance;
    address public lastDepositor;

    function deposit() public payable {
        if (msg.value != 1 ether) revert NotOneEtherSent();

        balance += msg.value;
        if (TARGET_AMOUNT <= balance) revert GameAlreadyEnded();

        lastDepositor = msg.sender;
    }

    function claimReward() public {
        if (TARGET_AMOUNT != balance) revert GameHasntEndedYet();
        if (msg.sender != lastDepositor) revert NotTheLastDepositor();

        (bool success, ) = lastDepositor.call{value: balance}("");
        if (!success) revert EthTransferFailed();
    }
}
