// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./Serenity.sol";

contract SerenityFactory {
    INonfungiblePositionManager public immutable nonFungiblePositionManager;
    IUniswapV3Factory public immutable uniswapV3Factory;
    mapping(ERC20 => Serenity) public protocolSerenityContracts;

    constructor(
        INonfungiblePositionManager nonFungiblePositionManager_,
        IUniswapV3Factory uniswapV3Factory_
    ) {
        nonFungiblePositionManager = nonFungiblePositionManager_;
        uniswapV3Factory = uniswapV3Factory_;
    }

    function createNewProtocol(
        ERC20 token0,
        ERC20 token1,
        string memory protocolName
    ) public {
        Serenity serenityContract = new Serenity(
            token0,
            token1,
            nonFungiblePositionManager,
            protocolName
        );

        address pool_ = uniswapV3Factory.createPool(
            address(token0),
            address(token1),
            500
        );

        IUniswapV3Pool pool = IUniswapV3Pool(pool_);

        pool.initialize(79228162514264337593543950336); // initializing with price as 1 baseToken per quote

        protocolSerenityContracts[token0] = serenityContract;
    }
}
