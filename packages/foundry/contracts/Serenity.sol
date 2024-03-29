// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/base/LiquidityManagement.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Serenity {
    mapping(address => mapping(uint256 => uint256)) spikesTimeline; // address => timestamp => spike
    mapping(uint256 => uint256) totalSpikeTimeline; // timestamp => totalSpike
    ERC20 token0;
    ERC20 token1;

    constructor(ERC20 token0_, ERC20 token1_) {
        token0 = token0_;
        token1 = token1_;
    }

    function addLiquidity() public {
        //call uniswap liq function
        //add a spike to height here at this particular timestamp. spike height depends on amount of liq added
    }

    function increaseLiquidity() public {
        //add a spike to height here at this particular timestamp. spike height depends on amount of liq added
    }

    function calculateVotingPowerForAt() public returns (uint256) {}

    function calculateTotalVotingPower() public returns (uint256) {}
}
