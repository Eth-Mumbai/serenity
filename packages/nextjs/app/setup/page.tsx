"use client";

import { useState } from "react";
import Protocol from "./firstStep";
import Token0 from "./secondStep";
import Token1 from "./thirdStep";

const MainForm = () => {
  const [data, setData] = useState({
    protocolName: "",
    image: "",
    token0Address: "",
    token1Address: "",
  });

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
            <button className="bg-[#19c5e2] px-10 py-2 rounded-xl  text-white" onClick={() => console.log(data)}>
              Submit
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default MainForm;
