// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.7.6;
pragma abicoder v2;

// voting power depends on liquidity added to the pool. voting power linearly decreases with time unless user adds more liqiuidity in which case there is a spike
// user has to lock the Liquidity Position unitl timelock ends.

// p ^
//   +
//   |  |\
//   |  | \ |\
//   |  |  \| \|\
//   |  |        \
// 0 +--------+------> time
//

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/base/LiquidityManagement.sol";
import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract Serenity is IERC721Receiver {
    mapping(address => mapping(uint256 => uint256)) public spikesTimeline; // address => timestamp => spike
    mapping(address => uint256[]) public spikeHistory; // address => timestamps[]

    mapping(address => uint256) public positionTokenIds; // address => PositionNFT id

    struct InitialPositionStruct {
        uint256 initialHeight;
        uint256 endTime;
    }

    mapping(address => InitialPositionStruct) public initialPositionData; // address => InitialPositionStruct ( we can recreate position data at any time w/ initialPositionStruct and spikesTimeline)

    ERC20 public token0;
    ERC20 public token1;

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

    function addNewLiquidity(
        uint24 fee,
        int24 tickLower,
        int24 tickUpper,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 timeToLock
    ) public {
        //get tokens from user
        TransferHelper.safeTransferFrom(
            address(token0),
            msg.sender,
            address(this),
            amount0Desired
        );
        TransferHelper.safeTransferFrom(
            address(token1),
            msg.sender,
            address(this),
            amount1Desired
        );

        //approve position manager for tokens
        TransferHelper.safeApprove(
            address(token0),
            address(nonfungiblePositionManager),
            amount0Desired
        );
        TransferHelper.safeApprove(
            address(token1),
            address(nonfungiblePositionManager),
            amount1Desired
        );

        INonfungiblePositionManager.MintParams
            memory params = INonfungiblePositionManager.MintParams({
                token0: address(token0),
                token1: address(token1),
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                recipient: address(this),
                deadline: block.timestamp
            });

        (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) = nonfungiblePositionManager.mint(params);

        _createDeposit(msg.sender, tokenId);

        if (amount0 < amount0Desired) {
            TransferHelper.safeApprove(
                address(token0),
                address(nonfungiblePositionManager),
                0
            );
            uint256 refund0 = amount0Desired - amount0;
            TransferHelper.safeTransfer(address(token0), msg.sender, refund0);
        }

        if (amount1 < amount1Desired) {
            TransferHelper.safeApprove(
                address(token1),
                address(nonfungiblePositionManager),
                0
            );
            uint256 refund1 = amount1Desired - amount1;
            TransferHelper.safeTransfer(address(token1), msg.sender, refund1);
        }

        initialPositionData[msg.sender] = InitialPositionStruct({
            initialHeight: uint256(liquidity),
            endTime: block.timestamp + timeToLock
        });

        spikesTimeline[msg.sender][block.timestamp] = uint256(liquidity);
        spikeHistory[msg.sender].push(block.timestamp);
    }

    function increaseLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) public {
        //get tokens from user
        TransferHelper.safeTransferFrom(
            address(token0),
            msg.sender,
            address(this),
            amount0Desired
        );
        TransferHelper.safeTransferFrom(
            address(token1),
            msg.sender,
            address(this),
            amount1Desired
        );

        //approve position manager for tokens
        TransferHelper.safeApprove(
            address(token0),
            address(nonfungiblePositionManager),
            amount0Desired
        );
        TransferHelper.safeApprove(
            address(token1),
            address(nonfungiblePositionManager),
            amount1Desired
        );

        uint256 tokenId = positionTokenIds[msg.sender];

        INonfungiblePositionManager.IncreaseLiquidityParams
            memory params = INonfungiblePositionManager
                .IncreaseLiquidityParams({
                    tokenId: tokenId,
                    amount0Desired: amount0Desired,
                    amount1Desired: amount1Desired,
                    amount0Min: amount0Min,
                    amount1Min: amount1Min,
                    deadline: block.timestamp
                });

        (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) = nonfungiblePositionManager.increaseLiquidity(params);

        uint256 newSpike = calculateVotingPowerForAt(
            msg.sender,
            block.timestamp
        ) + uint256(liquidity);

        spikesTimeline[msg.sender][block.timestamp] = newSpike;
        spikeHistory[msg.sender].push(block.timestamp);

        if (amount0 < amount0Desired) {
            TransferHelper.safeApprove(
                address(token0),
                address(nonfungiblePositionManager),
                0
            );
            uint256 refund0 = amount0Desired - amount0;
            TransferHelper.safeTransfer(address(token0), msg.sender, refund0);
        }

        if (amount1 < amount1Desired) {
            TransferHelper.safeApprove(
                address(token1),
                address(nonfungiblePositionManager),
                0
            );
            uint256 refund1 = amount1Desired - amount1;
            TransferHelper.safeTransfer(address(token1), msg.sender, refund1);
        }
    }

    function calculateVotingPowerForAt(
        address user,
        uint256 timestamp
    ) public returns (uint256) {
        uint256[] memory historyArray = spikeHistory[msg.sender];
        uint256 lastSpikeTimeStamp = 0;

        if (historyArray.length == 0) {
            return 0;
        }

        if (historyArray.length == 1) {
            lastSpikeTimeStamp = historyArray[0];
        } else {
            for (uint i; i < historyArray.length; i++) {
                if (i == historyArray.length - 1) {
                    lastSpikeTimeStamp = historyArray[i];
                    break;
                }
                if (
                    historyArray[i] <= timestamp &&
                    historyArray[i + 1] > timestamp
                ) {
                    lastSpikeTimeStamp = historyArray[i];
                    break;
                }
            }
        }

        uint256 endTime = initialPositionData[msg.sender].endTime;
        uint256 spikeHeight = spikesTimeline[msg.sender][lastSpikeTimeStamp];

        uint256 tanTheta = spikeHeight / (endTime - block.timestamp);

        uint256 spikeHeightCalculated = tanTheta * (endTime - timestamp);

        return spikeHeightCalculated;
    }

    // function collectFeeForPosition() public {
    //     //collect Fee
    // }

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
