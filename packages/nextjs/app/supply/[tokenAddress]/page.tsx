"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useContractRead } from "wagmi";
import { readContract, writeContract } from "wagmi/actions";
import { serenityABI, serenityManager, serenityManagerAbi } from "~~/contracts/deployedContracts";

const Page = ({ params }: { params: { slug: string } }) => {
  const [protocolTokenAddress, setProtocolTokenAddress] = useState("0x");
  const [fee, setFee] = useState("0x");
  const [tickLower, setTickLower] = useState(-10);
  const [tickUpper, setTickUpper] = useState(10);
  const [token1Amount, setToken1Amount] = useState(10);
  const [token2Amount, setToken2Amount] = useState(10);
  const [lockingPeriod, setLockingPeriod] = useState(2000);

  const slugAddress = params.tokenAddress;
  const { data: serenityAddress } = useContractRead({
    address: serenityManager,
    abi: serenityManagerAbi,
    functionName: "protocolSerenityContracts",
    args: [slugAddress],
  });
  const onSubmit = async () => {
    await writeContract({
      address: serenityAddress as string,
      abi: serenityABI,
      functionName: "addNewLiquidity",
      args: [fee, tickLower, tickUpper, token1Amount, token2Amount, 0, 0, lockingPeriod],
    });
  };

  return (
    <div className="mb-10">
      <motion.h1
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 50 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Add Liquidity To Pool
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 80 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="max-w-xs xl:max-w-lg mx-auto "
      >
        <form
          className=" px-8 pt-6 pb-8 mb-4
     max-w-5xl
     rounded-2xl
     text-[#1A2421]
     bg-blur-lg
     
     [ border-[1px] border-solid border-[#19c5e2] border-opacity-30 ]
     [ shadow-black/70 shadow-2xl ]"
        >
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={protocolTokenAddress}
              onChange={e => {
                setProtocolTokenAddress(e.target.value);
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Protocol token"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={fee}
              onChange={e => {
                setFee(e.target.value);
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Protocol fee"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              type="number"
              value={tickLower}
              onChange={e => {
                setTickLower(parseInt(e.target.value));
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              name="protocolName"
              id="protocolName"
              placeholder="Tick Lower"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={tickUpper}
              onChange={e => {
                setTickUpper(parseInt(e.target.value));
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Tick Upper"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={token1Amount}
              onChange={e => {
                setToken1Amount(parseInt(e.target.value));
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Amount of Token 0"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={token2Amount}
              onChange={e => {
                setToken2Amount(parseInt(e.target.value));
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Amount Of Token 1"
            />
          </label>
          <label
            htmlFor="email"
            className="text-white form-label relative block mb-4 text-black/50 focus-within:text-[#333]"
          >
            <svg
              className="label-icon 
        transition pointer-events-none
        [ w-6 h-6 ] 
        [ absolute top-1/2 left-3 ] 

        [ transform -translate-y-1/2 ]"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#19c5e2"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 1.95c-5.52 0-10 4.48-10 10s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57v-1.43c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57v-1.43c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
            </svg>
            {/* label-icon */}
            <input
              value={lockingPeriod}
              onChange={e => {
                setLockingPeriod(parseInt(e.target.value));
              }}
              className="form-input 
          
          block w-full rounded-lg leading-none focus:outline-none placeholder-white
          [ transition-colors duration-200 ] 
          [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
          [ bg-transparent  focus:placeholder-[#19c5e2] ] 
          [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Locking Period"
            />
          </label>
        </form>
        <button
          onClick={() => {
            onSubmit();
          }}
          className={`px-10 ml-auto py-2 rounded-xl bg-slate-800 text-white`}
        >
          Add Liquidity
        </button>
      </motion.div>
    </div>
  );
};

export default Page;
