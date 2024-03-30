import React, { useMemo } from "react";
import { ChartEntry } from "./types";
import { ScaleLinear, area, curveStepAfter } from "d3";
import inRange from "lodash/inRange";

export enum PriceFormats {
  TOKEN,
  USD,
}

export const Area = ({
  series,
  xScale,
  yScale,
  xValue,
  yValue,
  fill,
}: {
  series: ChartEntry[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleLinear<number, number>;
  xValue: (d: ChartEntry) => number;
  yValue: (d: ChartEntry) => number;
  fill?: string | undefined;
  priceFormat: PriceFormats;
}) =>
  useMemo(
    () => (
      <path
        className={`opacity-100 stroke-[#13151c] stroke-[2px] fill-transparent ${
          fill ? "stroke-[#2797FF] fill-[url(#liquidity-chart-gradient)]" : ""
        }`}
        d={
          area()
            .curve(curveStepAfter)
            .x((d: unknown) => xScale(xValue(d as ChartEntry)))
            .y1((d: unknown) => yScale(yValue(d as ChartEntry)))
            .y0(yScale(0))(
            series.filter(d => inRange(xScale(xValue(d)), 0, innerWidth)) as Iterable<[number, number]>,
          ) ?? undefined
        }
      />
    ),
    [fill, series, xScale, xValue, yScale, yValue],
  );
