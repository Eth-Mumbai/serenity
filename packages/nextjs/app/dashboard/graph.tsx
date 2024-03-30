"use client";

import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { ChartBarIcon } from "@heroicons/react/24/outline";

// If you're using Next.js please use the dynamic import for react-apexcharts and remove the import from the top for the react-apexcharts
// import dynamic from "next/dynamic";
// const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const chartConfig: {
  type?:
    | "line"
    | "area"
    | "bar"
    | "pie"
    | "donut"
    | "radialBar"
    | "scatter"
    | "bubble"
    | "heatmap"
    | "candlestick"
    | "boxPlot"
    | "radar"
    | "polarArea"
    | "rangeBar"
    | "rangeArea"
    | "treemap";
  series?: ApexOptions["series"];
  width?: string | number;
  height?: string | number;
  options?: ApexOptions;
  [key: string]: any;
} = {
  height: 200,
  series: [
    {
      name: "Sales",
      data: [50, 40, 300, 320, 500, 350, 200, 230, 500],
    },
  ],
  options: {
    chart: {
      toolbar: {
        show: false,
      },
    },
    title: {
      text: "",
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#020617"],
    stroke: {
      colors: ["#19c5e2"],
      lineCap: "round",
      curve: "smooth",
    },
    markers: {
      size: 0,
    },
    xaxis: {
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
      labels: {
        style: {
          colors: "#616161",
          fontSize: "12px",
          fontFamily: "inherit",
          fontWeight: 400,
        },
      },
      categories: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    yaxis: {
      labels: {
        style: {
          colors: "#616161",
          fontSize: "12px",
          fontFamily: "inherit",
          fontWeight: 400,
        },
      },
    },
    grid: {
      show: false,

      padding: {
        top: 5,
        right: 20,
      },
    },
    fill: {
      opacity: 0.8,
    },
    tooltip: {
      theme: "dark",
    },
  },
};

export default function Graph() {
  return (
    <div>
      <div color="transparent" className="flex flex-col gap-4 rounded-none md:flex-row md:items-center">
        <div className="w-max rounded-lg bg-gray-900 p-5 text-white">
          <ChartBarIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 color="blue-gray">Voting Power</h1>
        </div>
      </div>
      <div className="px-2 pb-0">
        <Chart {...chartConfig} />
      </div>
    </div>
  );
}
