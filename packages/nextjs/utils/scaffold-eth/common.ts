import tokens from "./token/tokens.json";
import { Price, Token } from "@pancakeswap/swap-sdk-core";
import { Currency, CurrencyAmount } from "@pancakeswap/swap-sdk-core";
import {
  FeeAmount,
  TICK_SPACINGS,
  TickMath,
  encodeSqrtRatioX96,
  nearestUsableTick,
  priceToClosestTick,
} from "@pancakeswap/v3-sdk";
import BigNumber from "bignumber.js";
import { parseUnits } from "viem";

// To be used in JSON.stringify when a field might be bigint
// https://wagmi.sh/react/faq#bigint-serialization
export const replacer = (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value);

export default function tryParseCurrencyAmount<T extends Currency>(
  value?: string,
  currency?: T,
): CurrencyAmount<T> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value as `${number}`, currency.decimals).toString();
    if (typedValueParsed !== "0") {
      return CurrencyAmount.fromRawAmount(currency, BigInt(typedValueParsed));
    }
  } catch (error) {
    // fails if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  return undefined;
}

export function tryParsePrice(baseToken?: Token, quoteToken?: Token, value?: string) {
  if (!baseToken || !quoteToken || !value) {
    return undefined;
  }

  if (!value.match(/^\d*\.?\d+$/)) {
    return undefined;
  }

  const [whole, fraction] = value.split(".");

  const decimals = fraction?.length ?? 0;
  const withoutDecimals = BigInt((whole ?? "") + (fraction ?? ""));

  return new Price(
    baseToken,
    quoteToken,
    BigInt(10 ** decimals) * BigInt(10 ** baseToken.decimals),
    withoutDecimals * BigInt(10 ** quoteToken.decimals),
  );
}

export function tryParseTick(feeAmount?: FeeAmount, price?: Price<Token, Token> | boolean): number | undefined {
  if (!price || !feeAmount || typeof price === "boolean") {
    return undefined;
  }

  let tick: number;

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator);

  if (sqrtRatioX96 >= TickMath.MAX_SQRT_RATIO) {
    tick = TickMath.MAX_TICK;
  } else if (sqrtRatioX96 <= TickMath.MIN_SQRT_RATIO) {
    tick = TickMath.MIN_TICK;
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price);
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount]);
}

export function getTokenUri(address: string | undefined): string | undefined {
  const index = tokens.findIndex(e => e.address.toLowerCase() == address?.toLowerCase());
  if (index !== -1) {
    return tokens[index].logoURI;
  }

  return "/tokens/defaultToken.webp";
}

export function formatBalance(value: BigNumber, raw = false): string {
  if (raw) {
    return value.toString(10);
  }
  if (value.gte(10)) {
    return value.dp(2).toString(10);
  } else if (value.gte(0.1)) {
    return value.dp(4).toString(10);
  } else if (value.gte(0.0001)) {
    return value.dp(5).toString(10);
  }

  return value.toString(10);
}

export function bigNumberToBigInt(value: BigNumber): bigint {
  if (value.isNaN()) {
    return 0n;
  }

  return BigInt(value.dp(0, 1).toString(10));
}
