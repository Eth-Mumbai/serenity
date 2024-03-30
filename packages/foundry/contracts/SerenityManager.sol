// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "./Serenity.sol";

contract SerenityFactory {
    INonfungiblePositionManager public immutable nonFungiblePositionManager;
    mapping(ERC20 => Serenity) public protocolSerenityContracts;

    constructor(INonfungiblePositionManager nonFungiblePositionManager_) {
        nonFungiblePositionManager = nonFungiblePositionManager_;
    }

    function createNewProtocol(
        ERC20 token0,
        ERC20 token1,
        string memory protocolName
    ) {
        Serenity serenityContract = new Serenity(
            token0,
            token1,
            nonFungiblePositionManager,
            protocolName
        );
        protocolSerenityContracts[token0] = serenityContract;
    }
}
