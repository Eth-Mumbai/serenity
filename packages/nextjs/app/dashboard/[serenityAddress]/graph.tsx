"use client";

import { useEffect, useState } from "react";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { serenityABI } from "~~/contracts/deployedContracts";

// If you're using Next.js please use the dynamic import for react-apexcharts and remove the import from the top for the react-apexcharts
// import dynamic from "next/dynamic";
// const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function Graph({ address }: { address: string }) {
  console.log(address);
  const [data, setData] = useState<any>(null);
  const [chartConfig, setChartConfig] = useState<any>(null);
  const account = useAccount();
  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      // Fetch data
      const contractdata: any = await readContract({
        address: "0x84a8ee07D02580bc000D3bEB1a4384555b8B77f9",
        abi: serenityABI,
        functionName: "initialPositionData",
        args: ["0xD02345816076267d3Abd3CcaB1168Df41C985853"],
      });

      setData(contractdata);
      const date1 = new Date(parseInt(contractdata[1]) * 1000);
      const date2 = new Date(parseInt(contractdata[2]) * 1000);

      setChartConfig({
        height: 200,
        series: [
          {
            name: "Voting Power",
            data: [(parseInt(contractdata[0]) / Math.pow(10, 18)).toFixed(0), 0],
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
            curve: "straight",
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
            categories: [date1.toDateString(), date2.toDateString()],
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
      });
    };
    fetchData();
  }, [address, account.address]);

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
      <div className="px-2 pb-0">{data && chartConfig && <Chart {...chartConfig} />}</div>
    </div>
  );
}
