// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract VaultTxOrigin {
    error NotAnOwner();
    error EthTransferFailed();

    address public owner;

    constructor(address _owner) payable {
        owner = _owner;
    }

    receive() external payable {}

    function withdraw(address to, uint256 amount) external {
        if (tx.origin != owner) revert NotAnOwner();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert EthTransferFailed();
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
