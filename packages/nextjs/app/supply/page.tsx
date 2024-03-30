import { useEffect, useState } from "react";
// import { usePool } from "../hooks/usePools";
// import { globalState } from "../state";
import { DaoVault } from "./DaoVault";
import { BigintIsh, Price, Token } from "@pancakeswap/sdk";
import { Position, TickMath, nearestUsableTick, tickToPrice } from "@pancakeswap/v3-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import BigNumber from "bignumber.js";
import { zeroAddress } from "viem";
import { useAccount, useBlockNumber, useChainId } from "wagmi";
import { Chart } from "~~/components/scaffold-eth/LiquidityChartRangeInput/Chart";
import { PriceFormats } from "~~/components/scaffold-eth/LiquidityChartRangeInput/types";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { usePool } from "~~/hooks/scaffold-eth/usePool";
import tryParseCurrencyAmount from "~~/utils/scaffold-eth/common";
import {
  bigNumberToBigInt,
  formatBalance,
  getTokenUri,
  tryParsePrice,
  tryParseTick,
} from "~~/utils/scaffold-eth/common";

enum FeeAmount {
  LOWEST = 100,
  LOW = 500,
  MEDIUM = 2500,
  HIGH = 10000,
}
const TICK_SPACINGS: { [amount in FeeAmount]: number } = {
  [FeeAmount.LOWEST]: 1,
  [FeeAmount.LOW]: 10,
  [FeeAmount.MEDIUM]: 50,
  [FeeAmount.HIGH]: 200,
};

const BN_TEN = new BigNumber(10);

const LiquiditySupply = () => {
  //   const vaultAddress = useSearchParams();
  //   const pairs = useAtomValue(globalState);
  const pairs = [
    {
      vaultAddress: "",
      price: "",
      lowerPrice: "",
      upperPrice: "",
      token0: `0x0000000000000000000000000`,
      token1: `0x0000000000000000000000000`,
      isToken0Base: true,
    },
  ];
  const vaultAddress = "";
  const currentPair = pairs?.find(e => e?.vaultAddress === vaultAddress);

  const chainId = useChainId();
  const account = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const currPrice = Number(currentPair ? currentPair.price : "0");
  const [openModal, setOpenModal] = useState(false);
  const [openSlippageModal, setOpenSlippageModal] = useState(false);
  const [slippagePercentage, setSlippagePercentage] = useState(0.5);
  const [baseTokenAmount, setBaseTokenAmount] = useState(0);
  const [quoteTokenAmount, setQuoteTokenAmount] = useState(1);
  const [minPriceSelected, setMinPriceSelected] = useState(
    Number(currentPair ? currentPair.lowerPrice : "0").toFixed(2),
  );
  const [maxPriceSelected, setMaxPriceSelected] = useState(
    Number(currentPair ? currentPair.upperPrice : "0").toFixed(2),
  );
  const [disableBaseToken, setDisableBaseToken] = useState(false);
  const [disableQuoteToken, setDisableQuoteToken] = useState(false);

  const [independentToken, setIndependentToken] = useState<"baseToken" | "quoteToken">("quoteToken");

  const { data: baseTokenSymbol } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token0 : currentPair?.token1,
    functionName: "symbol",
  });

  const { data: quoteTokenSymbol } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token1 : currentPair?.token0,
    functionName: "symbol",
  });

  const { data: quoteTokenDecimals } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token1 : currentPair?.token0,
    functionName: "decimals",
  });

  const { data: baseTokenDecimals } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token0 : currentPair?.token1,
    functionName: "decimals",
  });

  const { data: quoteTokenBalance, refetch: BalanceOfToken1Refetch } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token1 : currentPair?.token0,
    functionName: "balanceOf",
    args: [account.address!],
  });

  const { data: baseTokenBalance, refetch: BalanceOfToken2Refetch } = useScaffoldContractRead({
    contractName: "ERC20",
    address: currentPair?.isToken0Base ? currentPair?.token0 : currentPair?.token1,
    functionName: "balanceOf",
    args: [account.address!],
  });

  const { data: poolAddress } = useScaffoldContractRead({
    contractName: "ERC20",
    abi: DaoVault,
    address: currentPair?.vaultAddress,
    functionName: "pool",
  });

  const { data: fee } = useScaffoldContractRead({
    contractName: "ERC20",
    abi: [
      {
        inputs: [],
        name: "fee",
        outputs: [{ internalType: "uint24", name: "", type: "uint24" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    address: poolAddress,
    functionName: "fee",
  });

  const quoteToken: Token = new Token(
    chainId,
    currentPair ? (currentPair?.isToken0Base ? `0x${currentPair?.token1}` : `0x${currentPair?.token0}`) : zeroAddress,
    quoteTokenDecimals ? quoteTokenDecimals : 18,
    quoteTokenSymbol ? quoteTokenSymbol : "",
  );
  const baseToken: Token = new Token(
    chainId,
    currentPair ? (currentPair?.isToken0Base ? `0x${currentPair?.token0}` : `0x${currentPair?.token1}`) : zeroAddress,
    baseTokenDecimals ? baseTokenDecimals : 18,
    baseTokenSymbol ? baseTokenSymbol : "",
  );
  const upperPrice: Price<Token, Token> | undefined = tryParsePrice(quoteToken, baseToken, String(maxPriceSelected));
  const lowerPrice: Price<Token, Token> | undefined = tryParsePrice(quoteToken, baseToken, String(minPriceSelected));

  const lowerTick: number | undefined =
    minPriceSelected === "0"
      ? nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS])
      : tryParseTick(fee ? fee : 500, lowerPrice);

  const upperTick: number | undefined =
    maxPriceSelected === Number.MAX_SAFE_INTEGER.toString()
      ? nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS])
      : tryParseTick(fee ? fee : 500, upperPrice);

  //@ts-gnore
  const c = usePool(quoteToken, baseToken, fee ? fee : 500);

  const getIncrement = (tickPosition: "upper" | "lower") => {
    if (baseToken && quoteToken && typeof upperTick === "number" && typeof lowerTick == "number" && fee) {
      return tickPosition === "upper"
        ? tickToPrice(
            quoteToken,
            baseToken,
            currentPair?.isToken0Base
              ? upperTick - TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]
              : upperTick + TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS],
          ).toFixed(2)
        : tickToPrice(
            quoteToken,
            baseToken,
            currentPair?.isToken0Base
              ? lowerTick - TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]
              : lowerTick + TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS],
          ).toFixed(2);
    }
  };

  const getDecrement = (tickPosition: "upper" | "lower") => {
    if (baseToken && quoteToken && typeof upperTick === "number" && typeof lowerTick === "number" && fee) {
      return tickPosition === "upper"
        ? tickToPrice(
            quoteToken,
            baseToken,
            currentPair?.isToken0Base
              ? upperTick + TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]
              : upperTick - TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS],
          ).toFixed(2)
        : tickToPrice(
            quoteToken,
            baseToken,
            currentPair?.isToken0Base
              ? lowerTick + TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]
              : lowerTick - TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS],
          ).toFixed(2);
    }
  };

  const correctLowerPrice = (price: string | undefined) => {
    setMinPriceSelected(
      tickToPrice(
        quoteToken,
        baseToken,
        price
          ? tryParseTick(fee ? fee : 500, tryParsePrice(quoteToken, baseToken, price)!)!
          : nearestUsableTick(lowerTick!, TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]),
      ).toFixed(3),
    );
  };

  const correctUpperPrice = (price: string | undefined) => {
    setMaxPriceSelected(
      tickToPrice(
        quoteToken,
        baseToken,
        price
          ? tryParseTick(fee ? fee : 500, tryParsePrice(quoteToken, baseToken, price)!)!
          : nearestUsableTick(upperTick!, TICK_SPACINGS[fee as keyof typeof TICK_SPACINGS]),
      ).toFixed(3),
    );
  };

  useEffect(() => {
    if (currPrice) {
      if (Number(minPriceSelected) >= currPrice) {
        setDisableBaseToken(true);
      } else {
        setDisableBaseToken(false);
      }

      if (Number(maxPriceSelected) <= currPrice) {
        setDisableQuoteToken(true);
      } else {
        setDisableQuoteToken(false);
      }

      if (Number(maxPriceSelected) <= Number(minPriceSelected)) {
        setDisableBaseToken(true);
        setDisableQuoteToken(true);
      }
    }
  }, [minPriceSelected, maxPriceSelected, currPrice]);

  useEffect(() => {
    setMinPriceSelected(Number(currentPair ? currentPair.lowerPrice : "0").toFixed(2));
    setMaxPriceSelected(Number(currentPair ? currentPair.upperPrice : "0").toFixed(2));
  }, [currentPair]);

  useEffect(() => {
    (async () => {
      const [, pool] = await c;
      if (pool && lowerTick && upperTick) {
        const independentAmountRaw = independentToken === "baseToken" ? baseTokenAmount : quoteTokenAmount;
        if (independentAmountRaw == 0) {
          independentToken === "baseToken" ? setQuoteTokenAmount(0) : setBaseTokenAmount(0);
        } else {
          const independentAmount =
            independentToken === "baseToken"
              ? tryParseCurrencyAmount(String(baseTokenAmount), baseToken)
              : tryParseCurrencyAmount(String(quoteTokenAmount), quoteToken);
          independentToken === "baseToken"
            ? tryParseCurrencyAmount(String(baseTokenAmount), baseToken)
            : tryParseCurrencyAmount(String(quoteTokenAmount), quoteToken);

          const wrappedIndependentAmount = independentAmount?.wrapped;

          const position = wrappedIndependentAmount!.currency.equals(pool.token0)
            ? Position.fromAmount0({
                pool,
                tickLower: lowerTick < upperTick ? lowerTick : upperTick,
                tickUpper: upperTick > lowerTick ? upperTick : lowerTick,
                amount0: independentAmount?.quotient as BigintIsh,
                useFullPrecision: true, // we want full precision for the theoretical position
              })
            : Position.fromAmount1({
                pool,
                tickLower: lowerTick < upperTick ? lowerTick : upperTick,
                tickUpper: upperTick > lowerTick ? upperTick : lowerTick,
                amount1: independentAmount?.quotient as BigintIsh,
              });

          const dependentTokenAmount = wrappedIndependentAmount!.currency.equals(pool.token0)
            ? position.amount1
            : position.amount0;

          independentToken === "baseToken"
            ? setQuoteTokenAmount(Number(dependentTokenAmount.toExact()))
            : setBaseTokenAmount(Number(dependentTokenAmount.toExact()));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteToken, baseToken]);

  useEffect(() => {
    BalanceOfToken1Refetch();
    BalanceOfToken2Refetch();
  }, [blockNumber, BalanceOfToken1Refetch, BalanceOfToken2Refetch]);

  return (
    <div className="w-full flex justify-center items-center mt-6 sm:mt-12 lg:mt-16 mb-12">
      <div className="mx-4 sm:mx-6 md:mx-10 xl:mx-auto w-[60rem] h-[80rem] sm:h-[70rem] md:h-[40rem] rounded-[2rem] overflow-hidden glassmorphism">
        <div className="text-white font-bold border-b border-gray-700 border-solid h-[5rem] px-4 lg:px-12 flex justify-between items-center text-lg lg:text-2xl tracking-wider">
          <span>Add Liquidity</span>
          <svg
            className="h-7 w-7 cursor-pointer"
            fill="none"
            onClick={() => {
              setOpenSlippageModal(true);
            }}
            strokeWidth={2}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-rows-11 grid-rows-20 md:grid-rows-10 h-[calc(100%-5rem)]">
          <TokenPair currentPair={currentPair} baseTokenSymbol={baseTokenSymbol} quoteTokenSymbol={quoteTokenSymbol} />
          <PriceRangeChart
            currPrice={currPrice}
            minPriceSelected={minPriceSelected}
            maxPriceSelected={maxPriceSelected}
          />
          <DepositAmount
            currentPair={currentPair}
            baseTokenSymbol={baseTokenSymbol}
            quoteTokenSymbol={quoteTokenSymbol}
            baseTokenAmount={baseTokenAmount}
            quoteTokenAmount={quoteTokenAmount}
            setBaseTokenAmount={setBaseTokenAmount}
            setQuoteTokenAmount={setQuoteTokenAmount}
            quoteTokenBalance={quoteTokenBalance}
            baseTokenBalance={baseTokenBalance}
            setIndependentToken={setIndependentToken}
            quoteTokenDecimals={quoteTokenDecimals}
            baseTokenDecimals={baseTokenDecimals}
            disableBaseToken={disableBaseToken}
            disableQuoteToken={disableQuoteToken}
          />
          <PriceBoundsAndSubmit
            currPrice={currPrice}
            baseTokenSymbol={baseTokenSymbol}
            quoteTokenSymbol={quoteTokenSymbol}
            minPriceSelected={minPriceSelected}
            maxPriceSelected={maxPriceSelected}
            setMinPriceSelected={setMinPriceSelected}
            setMaxPriceSelected={setMaxPriceSelected}
            setOpenModal={setOpenModal}
            getIncrement={getIncrement}
            getDecrement={getDecrement}
            onBlurAdjustLower={correctLowerPrice}
            onBlurAdjustUpper={correctUpperPrice}
          />
        </div>
      </div>
      <ConfirmTxnModal
        account={account}
        blockNumber={blockNumber}
        openModal={openModal}
        setOpenModal={setOpenModal}
        quoteTokenAmount={quoteTokenAmount}
        baseTokenAmount={baseTokenAmount}
        lowerTick={lowerTick}
        upperTick={upperTick}
        currentPair={currentPair}
        baseTokenSymbol={baseTokenSymbol}
        quoteTokenSymbol={quoteTokenSymbol}
        quoteTokenDecimals={quoteTokenDecimals}
        baseTokenDecimals={baseTokenDecimals}
        vaultAddress={vaultAddress}
        slippagePercentage={slippagePercentage}
        disableBaseToken={disableBaseToken}
        disableQuoteToken={disableQuoteToken}
      />
      <SlippageModal
        openSlippageModal={openSlippageModal}
        setOpenSlippageModal={setOpenSlippageModal}
        setSlippagePercentage={setSlippagePercentage}
      />
    </div>
  );
};

export default LiquiditySupply;

const TokenPair = ({ currentPair, baseTokenSymbol, quoteTokenSymbol }: any) => {
  return (
    <div className="col-span-1 row-span-3 sm:row-span-2 md:row-span-3 px-4 lg:px-8 p-8">
      <p className="text-lg text-white font-bold tracking-wider">Token Pair</p>
      <div className="flex flex-row items-center justify-between mt-5 w-[15rem] lg:w-[22rem]">
        <div className="relative text-right w-[6rem] lg:w-[9rem]">
          <div className="inline-flex w-full h-[3rem] items-center justify-center rounded-md bg-black/30 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
            <img
              className="w-4 h-4 mr-2"
              src={currentPair?.isToken0Base ? getTokenUri(currentPair?.token1) : getTokenUri(currentPair?.token0)}
            />
            {quoteTokenSymbol}
          </div>
        </div>
        <div className="flex items-center justify-center">
          <svg
            className="w-5 h-5"
            fill="none"
            strokeWidth={2}
            stroke="white"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div className="relative text-right w-[6rem] lg:w-[9rem]">
          <div className="inline-flex w-full h-[3rem] items-center justify-center rounded-md bg-black/30 px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
            <img
              className="w-4 h-4 mr-2"
              src={currentPair?.isToken0Base ? getTokenUri(currentPair?.token0) : getTokenUri(currentPair?.token1)}
            />
            {baseTokenSymbol}
          </div>
        </div>
      </div>
      {/* <p className="text-lg text-white font-bold tracking-wider mt-4">
        Fee Tier
      </p> */}
      {/* <div className="flex justify-between mt-3 text-white w-[22rem] text-sm">
        <button className="p-1 px-1 border-[2px] border-solid border-gray-800 rounded-full min-w-20 text-center hover:bg-gray-700">
          0.01%
        </button>
        <button className="p-1 px-1 border-[2px] border-solid border-gray-800 rounded-full min-w-20 text-center hover:bg-gray-700">
          0.05%
        </button>
        <button className="p-1 px-1 border-[2px] border-solid border-gray-800 rounded-full min-w-20 text-center hover:bg-gray-700">
          0.25%
        </button>
        <button className="p-1 px-1 border-[2px] border-solid border-gray-800 rounded-full min-w-20 text-center hover:bg-gray-700">
          1%
        </button>
      </div> */}
    </div>
  );
};

const PriceRangeChart = ({ currPrice, minPriceSelected, maxPriceSelected }: any) => {
  return (
    <div className="col-span-1 row-span-5 px-4 lg:px-8 p-8">
      <div className="text-lg text-white font-bold tracking-wider flex justify-between items-center lg:items-baseline">
        <span>Price Range</span>
        <span className="text-xs font-normal pr-2 w-[6rem] lg:w-auto">current Price: ${currPrice.toFixed(2)}</span>
      </div>
      <Chart
        className="max-h-[14rem] sm:max-h-[18rem] md:max-h-none"
        data={{
          series: [
            {
              activeLiquidity: 800,
              price0: currPrice - 0.3 * currPrice,
            },
            {
              activeLiquidity: 900,
              price0: currPrice - 0.2 * currPrice,
            },
            {
              activeLiquidity: 800,
              price0: currPrice - 0.01 * currPrice,
            },
            {
              activeLiquidity: 1200,
              price0: currPrice + 0.2 * currPrice,
            },
            {
              activeLiquidity: 1200,
              price0: currPrice + 0.8 * currPrice,
            },
          ],
          current: currPrice,
        }}
        dimensions={{ width: 400, height: 230 }}
        margins={{ top: 20, right: 0, bottom: 30, left: 0 }}
        styles={{
          area: {
            selection: "#008FFF",
          },
        }}
        interactive={false}
        brushLabels={(_, x) => {
          const value = x < currPrice ? -((currPrice - x) / currPrice) * 100 : ((x - currPrice) / currPrice) * 100;
          return String(value.toFixed(1)) + " %";
        }}
        brushDomain={[minPriceSelected, maxPriceSelected]}
        onBrushDomainChange={() => {
          console.log();
        }}
        zoomLevels={{
          initialMin: -0.2,
          initialMax: 2,
          min: 0,
          max: 100,
        }}
        priceFormat={PriceFormats.USD}
      />
    </div>
  );
};

const DepositAmount = ({
  currentPair,
  baseTokenSymbol,
  quoteTokenSymbol,
  quoteTokenDecimals,
  baseTokenDecimals,
  baseTokenAmount,
  quoteTokenAmount,
  setBaseTokenAmount,
  setQuoteTokenAmount,
  quoteTokenBalance,
  baseTokenBalance,
  setIndependentToken,
  disableBaseToken,
  disableQuoteToken,
}: any) => {
  return (
    <div className="col-span-1 row-span-7 px-4 lg:px-8 p-8 pt-4">
      <p className="text-lg text-white font-bold tracking-wider">Deposit Amount</p>
      <div className="flex flex-col sm:flex-row md:flex-col sm:items-baseline sm:justify-center sm:gap-16 md:gap-6 justify-between mt-5">
        <div className="w-full md:pr-8">
          <div className="w-full sm:w-[16rem] md:w-full mt-3">
            <div className="flex flex-row justify-between text-white">
              <div className="flex gap-1 items-center">
                <img
                  className="w-6 h-6 mr-2"
                  src={currentPair?.isToken0Base ? getTokenUri(currentPair?.token1) : getTokenUri(currentPair?.token0)}
                />
                <p className="font-bold tracking-wide text-sm">{quoteTokenSymbol}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    setIndependentToken("quoteToken");
                    setQuoteTokenAmount(
                      formatBalance(
                        new BigNumber(quoteTokenBalance).div(BN_TEN.pow(quoteTokenDecimals ? quoteTokenDecimals : 18)),
                        true,
                      ),
                    );
                  }}
                  className="border px-2 rounded-full text-xs hover:bg-gray-500"
                >
                  Max
                </button>
                <p className="text-sm">
                  Balance:{" "}
                  {quoteTokenBalance
                    ? formatBalance(
                        new BigNumber(quoteTokenBalance).div(BN_TEN.pow(quoteTokenDecimals ? quoteTokenDecimals : 18)),
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-full rounded-xl bg-gray-700 h-[5rem] mt-4 flex flex-col justify-between p-3 py-4 text-white">
            <input
              type="number"
              className="bg-transparent text-right outline-none"
              disabled={disableQuoteToken}
              value={quoteTokenAmount}
              onChange={e => {
                setIndependentToken("quoteToken");
                setQuoteTokenAmount(e.target.value);
              }}
            />
            <div className="text-right text-[0.8rem] text-gray-400">
              {(quoteTokenAmount * Number(currentPair?.price)).toFixed(2)} USD
            </div>
            <div
              className={`${
                !disableQuoteToken && "hidden"
              } inset-0 z-10 absolute bg-gray-600 rounded-xl flex flex-col justify-between items-center p-2 py-3`}
            >
              <svg
                fill="none"
                className="w-5 h-5 text-gray-300"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <div className="text-xs px-2 text-center text-gray-300">
                The market price is outside your specified price range. Single-asset deposit only.
              </div>
            </div>
          </div>
        </div>
        <div className="w-full md:pr-8">
          <div className="w-full sm:w-[16rem] md:w-full mt-6">
            <div className="flex flex-row justify-between text-white">
              <div className="flex gap-1 items-center">
                <img
                  className="w-6 h-6 mr-2"
                  src={currentPair?.isToken0Base ? getTokenUri(currentPair?.token0) : getTokenUri(currentPair?.token1)}
                />
                <p className="font-bold tracking-wide text-sm">{baseTokenSymbol}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    setIndependentToken("baseToken");
                    setBaseTokenAmount(
                      formatBalance(
                        new BigNumber(baseTokenBalance).div(BN_TEN.pow(baseTokenDecimals ? baseTokenDecimals : 18)),
                        true,
                      ),
                    );
                  }}
                  className="border px-2 rounded-full text-xs hover:bg-gray-500"
                >
                  Max
                </button>
                <p className="text-sm">
                  Balance:{" "}
                  {baseTokenBalance
                    ? formatBalance(
                        new BigNumber(baseTokenBalance).div(BN_TEN.pow(baseTokenDecimals ? baseTokenDecimals : 18)),
                      )
                    : 0}
                </p>
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-full rounded-xl bg-gray-700 h-[5rem] mt-4 flex flex-col justify-between p-3 py-4 text-white">
            <input
              type="number"
              className="bg-transparent text-right outline-none"
              value={baseTokenAmount}
              disabled={disableBaseToken}
              onChange={e => {
                setIndependentToken("baseToken");
                setBaseTokenAmount(e.target.value);
              }}
            />
            <div className="text-right text-[0.8rem] text-gray-400">{baseTokenAmount} USD</div>
            <div
              className={`${
                !disableBaseToken && "hidden"
              } inset-0 z-10 absolute bg-gray-600 rounded-xl flex flex-col justify-between items-center p-2 py-3`}
            >
              <svg
                fill="none"
                className="w-5 h-5 text-gray-300"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <div className="text-xs px-2 text-center text-gray-300">
                The market price is outside your specified price range. Single-asset deposit only.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceBoundsAndSubmit = ({
  currPrice,
  baseTokenSymbol,
  quoteTokenSymbol,
  minPriceSelected,
  maxPriceSelected,
  setMinPriceSelected,
  setMaxPriceSelected,
  setOpenModal,
  getIncrement,
  getDecrement,
  onBlurAdjustLower,
  onBlurAdjustUpper,
}: any) => {
  const [selectedRange, setSelectedRange] = useState<0 | 1 | 2 | 3 | null>(null);

  return (
    <div className="col-span-1 row-span-5 px-4 lg:px-8 p-8 pt-0 text-white font-semibold flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-between md:mt-8 lg:mt-0">
        <div className="flex flex-col items-center bg-gray-700 rounded-xl p-6 py-4 gap-2 md:p-2 md:text-xs lg:text-base lg:p-6 lg:py-4 lg:gap-2">
          <div>Min Price</div>
          <div className="flex justify-between w-36">
            <button
              onClick={() => {
                setMinPriceSelected(getDecrement("lower"));
                setSelectedRange(null);
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
            <input
              className="min-w-0 bg-transparent text-center outline-none overscroll-auto px-1"
              type="number"
              value={minPriceSelected}
              onChange={e => {
                setMinPriceSelected(e.target.value);
              }}
              onBlur={() => {
                onBlurAdjustLower();
              }}
            />
            <button
              onClick={() => {
                setMinPriceSelected(getIncrement("lower"));
                setSelectedRange(null);
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </button>
          </div>
          <div>
            {baseTokenSymbol} per {quoteTokenSymbol}
          </div>
        </div>
        <div className="flex flex-col items-center bg-gray-700 rounded-xl p-6 py-4 gap-2 md:p-2 md:text-xs lg:text-base lg:p-6 lg:py-4 lg:gap-2">
          <div>Max Price</div>
          <div className="flex justify-between w-36">
            <button
              onClick={() => {
                setMaxPriceSelected(getDecrement("upper"));
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
            <input
              className="min-w-0 bg-transparent text-center outline-none overscroll-auto px-1 placeholder-white"
              placeholder={maxPriceSelected === Number.MAX_SAFE_INTEGER ? "∞" : ""}
              value={maxPriceSelected === Number.MAX_SAFE_INTEGER ? "" : maxPriceSelected}
              onChange={e => {
                setMaxPriceSelected(e.target.value);
              }}
              onBlur={() => {
                onBlurAdjustUpper();
              }}
            />
            <button
              onClick={() => {
                setMaxPriceSelected(getIncrement("upper"));
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </button>
          </div>
          <div>
            {baseTokenSymbol} per {quoteTokenSymbol}
          </div>
        </div>
      </div>
      <div className="hidden lg:flex justify-between my-4">
        <button
          onClick={() => {
            onBlurAdjustLower(String(currPrice - currPrice * 0.1));
            onBlurAdjustUpper(String(currPrice + currPrice * 0.1));
            setSelectedRange(prev => (prev !== 0 ? 0 : null));
          }}
          className={`${
            selectedRange === 0 && "bg-green-400 text-black"
          } p-2 px-4 border-[2px] border-solid border-green-400 rounded-full min-w-20 text-center hover:bg-green-400 hover:text-black`}
        >
          10%
        </button>
        <button
          onClick={() => {
            onBlurAdjustLower(String(currPrice - currPrice * 0.25));
            onBlurAdjustUpper(String(currPrice + currPrice * 0.25));
            setSelectedRange(prev => (prev !== 1 ? 1 : null));
          }}
          className={`${
            selectedRange === 1 && "bg-green-400 text-black"
          } p-2 px-4 border-[2px] border-solid border-green-400 rounded-full min-w-20 text-center hover:bg-green-400 hover:text-black`}
        >
          25%
        </button>
        <button
          onClick={() => {
            onBlurAdjustLower(String(currPrice - currPrice * 0.5));
            onBlurAdjustUpper(String(currPrice + currPrice * 0.5));
            setSelectedRange(prev => (prev !== 2 ? 2 : null));
          }}
          className={`${
            selectedRange === 2 && "bg-green-400 text-black"
          } p-2 px-4 border-[2px] border-solid border-green-400 rounded-full min-w-20 text-center hover:bg-green-400 hover:text-black`}
        >
          50%
        </button>
        <button
          onClick={() => {
            setMinPriceSelected(0);
            setMaxPriceSelected(Number.MAX_SAFE_INTEGER);
            setSelectedRange(prev => (prev !== 3 ? 3 : null));
          }}
          className={`${
            selectedRange === 3 && "bg-green-400 text-black"
          } p-2 px-4 border-[2px] border-solid border-green-400 rounded-full min-w-20 text-center hover:bg-green-400 hover:text-black`}
        >
          Full Range
        </button>
      </div>
      {/* <button className="w-full flex justify-center items-center bg-green-500 rounded-xl p-3 font-bold tracking-widest text-lg">
        Connect Wallet
      </button> */}
      <ConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              className="my-4 lg:my-0"
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      className="w-full flex justify-center items-center bg-green-500 rounded-xl p-3 font-bold tracking-widest text-lg"
                      onClick={openConnectModal}
                      type="button"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      className="w-full flex gap-3 justify-center items-center bg-green-500 rounded-xl p-3 font-bold tracking-widest text-lg"
                      onClick={openChainModal}
                      type="button"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        strokeWidth={2}
                        stroke="white"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                        />
                      </svg>
                      Wrong network
                    </button>
                  );
                }

                return (
                  <button
                    onClick={() => {
                      setOpenModal(true);
                    }}
                    className="w-full flex justify-center items-center bg-green-500 rounded-xl p-3 font-bold tracking-widest text-lg"
                  >
                    Add Liquidity
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
};

const ConfirmTxnModal = ({
  account,
  blockNumber,
  openModal,
  setOpenModal,
  quoteTokenAmount,
  baseTokenAmount,
  lowerTick,
  upperTick,
  currentPair,
  baseTokenSymbol,
  quoteTokenSymbol,
  vaultAddress,
  quoteTokenDecimals,
  baseTokenDecimals,
  slippagePercentage,
  disableBaseToken,
  disableQuoteToken,
}: any) => {
  const [baseTokenApproved, setBaseTokenApproved] = useState(false);
  const [quoteTokenApproved, setQuoteTokenApproved] = useState(false);
  const baseTokenAmountBigInt = disableBaseToken
    ? 0n
    : bigNumberToBigInt(
        new BigNumber(baseTokenAmount ?? 0).times(BN_TEN.pow(baseTokenDecimals ? baseTokenDecimals : 18)),
      );
  const { writeAsync: writeContract } = useScaffoldContractWrite({
    contractName: "",
    address: currentPair?.isToken0Base ? currentPair?.token0 : currentPair?.token1,
    functionName: "approve",
    args: [vaultAddress, baseTokenAmountBigInt],
    blockConfirmations: 1,
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const quoteTokenAmountBigInt = disableQuoteToken
    ? 0n
    : bigNumberToBigInt(
        new BigNumber(quoteTokenAmount ?? 0).times(BN_TEN.pow(quoteTokenDecimals ? quoteTokenDecimals : 18)),
      );

  const { writeAsync: writeContract2 } = useScaffoldContractWrite({
    contractName: "",
    address: currentPair?.isToken0Base ? currentPair?.token1 : currentPair?.token0,
    args: [vaultAddress, quoteTokenAmountBigInt],
    functionName: "approve",
    blockConfirmations: 1,
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });
  const baseTokenOutAmount = disableBaseToken
    ? 0n
    : bigNumberToBigInt(
        new BigNumber(baseTokenAmount ?? 0)
          .times(BN_TEN.pow(baseTokenDecimals ? baseTokenDecimals : 18))
          .times(100 - slippagePercentage)
          .div(100),
      );
  const quoteTokenOutAmount = disableQuoteToken
    ? 0n
    : bigNumberToBigInt(
        new BigNumber(quoteTokenAmount ?? 0)
          .times(BN_TEN.pow(quoteTokenDecimals ? quoteTokenDecimals : 18))
          .times(100 - slippagePercentage)
          .div(100),
      );
  const { writeAsync: writeContract3 } = useScaffoldContractWrite({
    contractName: "",
    abi: DaoVault,
    address: vaultAddress,
    functionName: "addLiquidity",
    args: [
      currentPair?.isToken0Base ? baseTokenAmountBigInt : quoteTokenAmountBigInt,
      currentPair?.isToken0Base ? quoteTokenAmountBigInt : baseTokenAmountBigInt,
      lowerTick < upperTick ? lowerTick : (upperTick as number),
      upperTick > lowerTick ? upperTick : (lowerTick as number),
      [0n, 0n],
      [
        currentPair?.isToken0Base ? baseTokenOutAmount : quoteTokenOutAmount,
        currentPair?.isToken0Base ? quoteTokenOutAmount : baseTokenOutAmount,
      ],
    ],
    blockConfirmations: 1,
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const { data: quoteTokenAllowance, refetch: RefetchQuoteTokenAllowance } = useScaffoldContractRead({
    contractName: "",
    address: currentPair?.isToken0Base ? currentPair?.token1 : currentPair?.token0,
    functionName: "allowance",
    args: [account.address!, vaultAddress],
  });

  const { data: baseTokenAllowance, refetch: RefetchBaseTokenAllowance } = useScaffoldContractRead({
    contractName: "",
    address: currentPair?.isToken0Base ? currentPair?.token0 : currentPair?.token1,
    functionName: "allowance",
    args: [account.address!, vaultAddress],
  });

  useEffect(() => {
    RefetchQuoteTokenAllowance();
    RefetchBaseTokenAllowance();
  }, [blockNumber]);

  useEffect(() => {
    quoteTokenAllowance! >= quoteTokenAmountBigInt ? setQuoteTokenApproved(true) : setQuoteTokenApproved(false);

    baseTokenAllowance! >= baseTokenAmountBigInt ? setBaseTokenApproved(true) : setBaseTokenApproved(false);
  }, [quoteTokenAllowance, baseTokenAllowance, baseTokenAmountBigInt, quoteTokenAmountBigInt]);

  return (
    <div className={`${!openModal && "hidden"} fixed bg-black/70 inset-0`}>
      <div className="fixed  h-[16rem] w-[20rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl modalBG p-5 py-10">
        <svg
          onClick={() => {
            setOpenModal(false);
          }}
          className="bg-black/20 hover:bg-black/40 w-6 h-6 rounded-full p-[1px] right-[8px] top-[8px] absolute stroke-[2px] cursor-pointer"
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <div className="flex flex-col justify-between mx-10 h-full">
          <button
            onClick={() => {
              writeContract();
            }}
            disabled={baseTokenApproved}
            className={`${
              baseTokenApproved
                ? "bg-gray-500 hover:border-transparent hover:text-gray-800 text-gray-800 active:bg-gray-500"
                : "bg-white"
            }  active:bg-gray-300 p-[0.4rem] px-4 rounded-lg border-[2px] hover:text-black hover:border-black border-solid text-gray-700 border-gray-500 font-semibold`}
          >
            Approve {baseTokenSymbol}
          </button>
          <button
            onClick={() => {
              writeContract2();
            }}
            disabled={quoteTokenApproved || !baseTokenApproved}
            className={`${
              quoteTokenApproved || !baseTokenApproved
                ? "bg-gray-500 hover:border-transparent hover:text-gray-800 text-gray-800 active:bg-gray-500"
                : "bg-white"
            }  active:bg-gray-300 p-[0.4rem] px-4 rounded-lg border-[2px] hover:text-black hover:border-black border-solid text-gray-700 border-gray-500 font-semibold`}
          >
            Approve {quoteTokenSymbol}
          </button>
          <button
            onClick={() => {
              writeContract3();
            }}
            disabled={!baseTokenApproved || !quoteTokenApproved}
            className={`${
              !baseTokenApproved || !quoteTokenApproved
                ? "bg-gray-500 hover:border-transparent hover:text-gray-800 text-gray-800 active:bg-gray-500"
                : "bg-white"
            }  active:bg-gray-300 p-[0.4rem] px-4 rounded-lg border-[2px] hover:text-black hover:border-black border-solid text-gray-700 border-gray-500 font-semibold`}
          >
            Send Txn
          </button>
        </div>
      </div>
    </div>
  );
};

const SlippageModal = ({ openSlippageModal, setOpenSlippageModal, setSlippagePercentage }: any) => {
  const [selectedSlippage, setSelectedSlippage] = useState<0 | 1 | 2 | 3>(1);
  const [slippageInputValue, setSlippageInputValue] = useState(0.5);

  return (
    <div className={`${!openSlippageModal && "hidden"} fixed bg-black/70 inset-0`}>
      <div className="fixed  h-[13rem] w-[20rem] sm:w-[25rem] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl modalBG p-5 py-10">
        <svg
          onClick={() => {
            setOpenSlippageModal(false);
          }}
          className={`bg-black/20 hover:bg-black/40 w-6 h-6 rounded-full p-[1px] right-[8px] top-[8px] absolute stroke-[2px] cursor-pointer`}
          fill="none"
          strokeWidth={1.5}
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <div className="text-lg text-white font-bold tracking-wider">Slippage Tolerance</div>
        <div className="flex justify-between my-4 text-white items-center">
          <button
            onClick={() => {
              setSlippagePercentage(0.1);
              setSelectedSlippage(0);
            }}
            className={`${
              selectedSlippage === 0 ? "bg-green-400 text-black" : "text-white"
            } w-[5rem] font-semibold p-1 px-2 border-[2px] border-solid border-green-400 rounded-full text-center hover:bg-green-400 hover:text-black`}
          >
            0.1%
          </button>
          <button
            onClick={() => {
              setSlippagePercentage(0.5);
              setSelectedSlippage(1);
            }}
            className={`${
              selectedSlippage === 1 ? "bg-green-400 text-black" : "text-white"
            } w-[5rem] font-semibold p-1 px-2 border-[2px] border-solid border-green-400 rounded-full text-center hover:bg-green-400 hover:text-black`}
          >
            0.5%
          </button>
          <button
            onClick={() => {
              setSlippagePercentage(1.0);
              setSelectedSlippage(2);
            }}
            className={`${
              selectedSlippage === 2 ? "bg-green-400 text-black" : "text-white"
            } w-[5rem] font-semibold p-1 px-2 border-[2px] border-solid border-green-400 rounded-full text-center hover:bg-green-400 hover:text-black`}
          >
            1.0%
          </button>
          <input
            onChange={e => {
              setSlippagePercentage(Number(e.target.value));
              setSlippageInputValue(Number(e.target.value));
              setSelectedSlippage(3);
            }}
            onClick={() => {
              setSelectedSlippage(3);
              setSlippagePercentage(slippageInputValue);
            }}
            value={slippageInputValue}
            type="number"
            className={`${
              selectedSlippage === 3 ? "bg-green-400 text-black" : "bg-gray-700/20 text-white"
            } w-[5rem] font-semibold  p-1 px-2 border-[2px] border-solid border-green-400 rounded-full text-center hover:bg-green-400 hover:text-black inline min-w-0`}
          />
          %
        </div>
        <button
          className="ml-auto px-8 mt-7 flex gap-2 items-center bg-white p-[0.4rem] rounded-lg border-[2px] hover:text-black hover:border-black border-solid text-gray-700 border-gray-500 font-semibold active:bg-gray-300"
          onClick={() => setOpenSlippageModal(false)}
          type="button"
        >
          Ok
        </button>
      </div>
    </div>
  );
};
