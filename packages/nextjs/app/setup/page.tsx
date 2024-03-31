"use client";

import { useState } from "react";
import Protocol from "./firstStep";
import ENS from "./fourthStep";
import Token0 from "./secondStep";
import Token1 from "./thirdStep";
import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { readContract } from "wagmi/actions";
import { writeContract } from "wagmi/actions";
import { serenityManager, serenityManagerAbi } from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

const MainForm = () => {
  const [data, setData] = useState({
    ens: "",
    protocolName: "",
    image: "",
    token0Address: "",
    token1Address: "",
  });

  const onSubmit = async () => {
    if (typeof window === "undefined") return;
    const hub = "https://testnet.hub.snapshot.org";
    const client = new snapshot.Client712(hub);

    const web3 = new Web3Provider(window!.ethereum as ExternalProvider | JsonRpcFetchFunc);
    const [account] = await web3.listAccounts();
    console.log(account);

    const serenityAddress = await readContract({
      address: serenityManager,
      abi: serenityManagerAbi,
      functionName: "protocolSerenityContracts",
      args: [data.token0Address],
    });
    console.log(serenityAddress);
    const receipt = await client.space(web3, account, {
      space: `${data.ens}`,
      settings: `{
    "admins": [
    ],
    "boost": {
        "bribeEnabled": false,
        "enabled": true
    },
    "categories": [
    ],
    "children": [
    ],
    "filters": {
        "minScore": 0,
        "onlyMembers": false
    },
    "members": [
    ],
    "moderators": [
    ],
    "name": "${data.protocolName}",
    "network": "11155111",
    "plugins": {
    },
    "private": false,
    "strategies": [
        {
            "name": "contract-call",
            "network": "11155111",
            "params": {
                "address": "${serenityAddress}",
                "args": [
                    "%{address}",
                    "1711910427"
                ],
                "decimals": 18,
                "methodABI": {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "calculateVotingPowerForAt",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                "symbol": "veMTK"
            }
        }
    ],
    "symbol": "veMTK",
    "treasuries": [
    ],
    "validation": {
        "name": "basic",
        "params": {
            "minScore": 1
        }
    },
    "voteValidation": {
        "name": "any",
        "params": {
        }
    },
    "voting": {
        "delay": 0,
        "hideAbstain": false,
        "period": 0,
        "privacy": "",
        "quorum": 0,
        "type": ""
    }
}`,
    });

    console.log(receipt);

    await writeContract({
      address: serenityManager,
      abi: serenityManagerAbi,
      functionName: "createNewProtocol",
      args: [data.token0Address, data.token1Address, data.protocolName],
    });
  };

  const handleChange = (event: any) => {
    console.log(data);
    if (event.target.files) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({
          ...data,
          image: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
      return;
    }
    const { name, value } = event.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  const [activeTab, setActiveTab] = useState(0);

  const formElements = [
    <Protocol key="protocol" data={data} handleChange={handleChange} />,
    <Token0 key="token0" data={data} handleChange={handleChange} />,
    <Token1 key="token1" data={data} handleChange={handleChange} />,
    <ENS key="ens" data={data} handleChange={handleChange} />,
  ];

  return (
    <>
      <div className="flex flex-grow flex-col content-center">
        <div>{formElements[activeTab]}</div>
      </div>
      <div className="relative h-full w-full">
        <div className="top-[100px] fixed flex gap-x-6 absolute inset-x-0 bottom-0 h-10 justify-center">
          <button
            disabled={activeTab === 0 ? true : false}
            onClick={() => setActiveTab(prev => prev - 1)}
            className={`px-10 py-2 rounded-xl bg-slate-800 text-white ${
              activeTab === 0 ? "opacity-50 bg-slate-600" : "opacity-100"
            }`}
          >
            Back
          </button>

          <button
            disabled={activeTab === formElements.length - 1 ? true : false}
            onClick={() => setActiveTab(prev => prev + 1)}
            className={`px-10 py-2 rounded-xl bg-[#19c5e2] text-white ${
              activeTab === formElements.length - 1 ? "opacity-50 bg-slate-600" : "opacity-100"
            }`}
          >
            Next
          </button>
          {activeTab === formElements.length - 1 ? (
            <button className="bg-[#19c5e2] px-10 py-2 rounded-xl  text-white" onClick={async () => await onSubmit()}>
              Submit
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default MainForm;
