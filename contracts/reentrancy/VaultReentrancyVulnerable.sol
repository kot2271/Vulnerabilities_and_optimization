// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract VaultReentrancyVulnerable {
    error EthTransferFailed();

    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert EthTransferFailed();
        balances[msg.sender] = 0;
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
