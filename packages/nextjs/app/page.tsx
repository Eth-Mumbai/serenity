"use client";

import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { Tranquiluxe } from "uvcanvas";

const Home: NextPage = () => {
  const router = useRouter();
  return (
    <>
      <div className="w-full h-full relative h-screen">
        <div className="absolute flex h-full w-full flex-col items-center justify-center">
          <h1 className="text-center text-4xl font-bold text-white">
            Power hyper <span className="text-white font-alsscrp text-7xl font-bold">governance</span> strategies,{" "}
            <br />
            right to social feeds of your users
          </h1>
          <br />

          <button
            className="btn btn-primary btn-md"
            onClick={() => {
              router.push("/setup");
            }}
            type="button"
          >
            Go to Dapp
          </button>
        </div>
        <Tranquiluxe />
      </div>
    </>
  );
};

export default Home;
