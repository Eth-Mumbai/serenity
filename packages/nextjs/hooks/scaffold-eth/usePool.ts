import { useMemo } from "react";
import { v3PoolStateABI } from "./PoolState";
import { BigintIsh, Currency, Token } from "@pancakeswap/swap-sdk-core";
import { DEPLOYER_ADDRESSES, FeeAmount, Pool, computePoolAddress } from "@pancakeswap/v3-sdk";
import { Address } from "viem";
import { readContract } from "wagmi/actions";
import scaffoldConfig from "~~/scaffold.config";

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

async function useMultipleContractSingleData({
  addresses,
  abi,
  functionName,
}: {
  addresses: (Address | undefined)[];
  abi: any;
  functionName: string;
}): Promise<any> {
  const result = await Promise.allSettled(
    addresses.map(async addr => {
      const result = await readContract({
        abi: abi,
        address: addr!,
        args: [],
        functionName: functionName,
      });
      return result;
    }),
  );

  return result.map(e => (e.status === "fulfilled" ? e.value : null));
}

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128;

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = [];

  private static addresses: { key: string; address: string }[] = [];

  static getPoolAddress(deployerAddress: Address, tokenA: Token, tokenB: Token, fee: FeeAmount): string {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2);
    }

    const { address: addressA } = tokenA;
    const { address: addressB } = tokenB;
    const key = `${deployerAddress}:${addressA}:${addressB}:${fee.toString()}`;

    const found = this.addresses.find(address => address.key === key);
    if (found) return found.address;

    const address = {
      key,
      address: computePoolAddress({
        deployerAddress,
        tokenA,
        tokenB,
        fee,
      }),
    };

    this.addresses.unshift(address);
    return address.address;
  }

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number,
    feeProtocol?: number,
  ): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2);
    }

    const found = this.pools.find(
      pool =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        pool.sqrtRatioX96 === sqrtPriceX96 &&
        pool.liquidity === liquidity &&
        pool.tickCurrent === tick,
    );
    if (found) return found;

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick);
    pool.feeProtocol = feeProtocol;
    this.pools.unshift(pool);
    return pool;
  }
}

export async function usePools(
  poolKeys: [Currency | undefined | null, Currency | undefined | null, FeeAmount | undefined][],
): Promise<[PoolState, Pool | null][]> {
  const chainId = scaffoldConfig.targetNetworks[0].id;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length);

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped;
        const tokenB = currencyB.wrapped;
        if (tokenA.equals(tokenB)) return undefined;

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, feeAmount] : [tokenB, tokenA, feeAmount];
      }
      return undefined;
    });
  }, [chainId, poolKeys]);
  console.log("poolTokens", poolTokens);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const poolAddresses: (Address | undefined)[] = useMemo(() => {
    const v3CoreDeployerAddress = chainId && DEPLOYER_ADDRESSES[chainId as keyof typeof DEPLOYER_ADDRESSES];
    if (!v3CoreDeployerAddress) return new Array(poolTokens.length);

    return poolTokens.map(value => value && PoolCache.getPoolAddress(v3CoreDeployerAddress, ...value));
  }, [chainId, poolTokens]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const slot0s = await useMultipleContractSingleData({
    addresses: poolAddresses,
    abi: v3PoolStateABI,
    functionName: "slot0",
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const liquidities = await useMultipleContractSingleData({
    addresses: poolAddresses,
    abi: v3PoolStateABI,
    functionName: "liquidity",
  });

  return poolKeys.map((_key, index) => {
    const tokens = poolTokens[index];
    if (!tokens) return [PoolState.INVALID, null];
    const [token0, token1, fee] = tokens;

    if (!slot0s[index]) return [PoolState.INVALID, null];
    const slot01 = slot0s[index];

    if (!liquidities[index]) return [PoolState.INVALID, null];
    const liquidity = liquidities[index];

    if (!tokens) return [PoolState.INVALID, null];
    // if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null];
    if (!slot01 || typeof liquidity === "undefined") return [PoolState.NOT_EXISTS, null];

    const [sqrtPriceX96, tick, feeProtocol] = [slot01[0], slot01[1], slot01[5]];
    if (!sqrtPriceX96 || sqrtPriceX96 === 0n) return [PoolState.NOT_EXISTS, null];

    try {
      const pool = PoolCache.getPool(token0, token1, fee, sqrtPriceX96, liquidity as BigintIsh, tick, feeProtocol);
      return [PoolState.EXISTS, pool];
    } catch (error) {
      console.error("Error when constructing the pool", error);
      return [PoolState.NOT_EXISTS, null];
    }
  });
}

export async function usePool(
  currencyA: Currency | undefined | null,
  currencyB: Currency | undefined | null,
  feeAmount: FeeAmount | undefined,
): Promise<[PoolState, Pool | null]> {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const poolKeys: [Currency | undefined | null, Currency | undefined | null, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount],
  );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const v = (await usePools(poolKeys))[0];
  return v;
}
