// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract VaultForEOAProtected {
    event MoneyGrabbed(address indexed sender, uint256 amount);

    error EthTransferFailed();
    error CallerIsContract();

    receive() external payable {}

    function isContract(address account) public view returns (bool) {
        uint256 size = account.code.length;
        return size > 0;
    }

    function grabMoneyIfNotAContract() external {
        if (msg.sender != tx.origin) revert CallerIsContract();
        uint256 balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: balance}("");
        if (success) {
            emit MoneyGrabbed(msg.sender, balance);
        } else {
            revert EthTransferFailed();
        }
    }
}
