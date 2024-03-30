import React, { useMemo } from "react";
import { ScaleLinear } from "d3";
import { useTranslation } from "react-i18next";

export const Line = ({
  value,
  xScale,
  innerHeight,
}: {
  value: number;
  xScale: ScaleLinear<number, number>;
  innerHeight: number;
}) => {
  const { t } = useTranslation();
  return useMemo(
    () => (
      <>
        <line
          className="opacity-50 stroke-2 stroke-[#8bb6ff] [stroke-dasharray:3] fill-none"
          x1={xScale(value)}
          y1="3"
          x2={xScale(value)}
          y2={innerHeight - 0.5}
        />
        <rect
          x={xScale(value) - 22}
          y={0}
          width={45}
          height={15}
          fill={"#ff7847"}
          rx={4}
        />
        <text fill={"white"} fontSize={9} x={xScale(value) - 18} y={11}>
          {t("currPrice")}
        </text>
      </>
    ),
    [value, xScale, innerHeight, t]
  );
};
