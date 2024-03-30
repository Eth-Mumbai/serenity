// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/base/LiquidityManagement.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract Serenity is IERC721Receiver {
    mapping(address => mapping(uint256 => uint256)) spikesTimeline; // address => timestamp => spike
    mapping(uint256 => uint256) totalSpikeTimeline; // timestamp => totalSpike
    ERC20 token0;
    ERC20 token1;

    INonfungiblePositionManager public immutable nonfungiblePositionManager;

    struct Deposit {
        address owner;
        uint128 liquidity;
        address token0;
        address token1;
    }

    mapping(uint256 => Deposit) public deposits;

    constructor(
        ERC20 token0_,
        ERC20 token1_,
        INonfungiblePositionManager _nonfungiblePositionManager
    ) {
        token0 = token0_;
        token1 = token1_;
        nonfungiblePositionManager = _nonfungiblePositionManager;
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

    function _createDeposit(address owner, uint256 tokenId) internal {
        (
            ,
            ,
            address token0,
            address token1,
            ,
            ,
            ,
            uint128 liquidity,
            ,
            ,
            ,

        ) = nonfungiblePositionManager.positions(tokenId);

        // set the owner and data for position
        // operator is msg.sender
        deposits[tokenId] = Deposit({
            owner: owner,
            liquidity: liquidity,
            token0: token0,
            token1: token1
        });
    }

    function onERC721Received(
        address operator,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        // get position information
        _createDeposit(operator, tokenId);
        return this.onERC721Received.selector;
    }
}
