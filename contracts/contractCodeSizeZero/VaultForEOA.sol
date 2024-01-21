// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract VaultForEOA {
    error EthTransferFailed();
    error CallerIsContract();

    receive() external payable {}

    function isContract(address account) public view returns (bool) {
        uint256 size = account.code.length;
        return size > 0;
    }

    function grabMoneyIfNotAContract() external {
        if (isContract(msg.sender)) revert CallerIsContract();
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert EthTransferFailed();
    }
}
