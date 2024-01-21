// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract VaultTxOriginProtected {
    error NotAnOwner();
    error EthTransferFailed();
    error ZeroAddress();
    error ZeroAmount();

    address public immutable owner;

    constructor() payable {
        if (msg.sender == address(0)) revert ZeroAddress();
        owner = msg.sender;
    }

    receive() external payable {}

    function withdraw(address to, uint256 amount) external {
        if (msg.sender != owner) revert NotAnOwner();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert EthTransferFailed();
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
