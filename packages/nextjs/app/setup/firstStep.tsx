import React from "react";
import { motion } from "framer-motion";

const Protocol = (props: any) => {
  const { data, handleChange } = props;

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 50 }}
        transition={{
          delay: 0.1,
          duration: 0.5,
          ease: "easeInOut",
        }}
        className="mt-4 bg-gradient-to-br from-slate-300 to-slate-500 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        Setup your protocol
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
              onChange={handleChange}
              value={data.protocolName}
              className="form-input 
              
              block w-full rounded-lg leading-none focus:outline-none placeholder-white
              [ transition-colors duration-200 ] 
              [ py-3 pr-3 md:py-4 md:pr-4 lg:py-4 lg:pr-4 pl-12 ] 
              [ bg-transparent  focus:placeholder-[#19c5e2] ] 
              [ text-white focus:text-white ]"
              type="name"
              name="protocolName"
              id="protocolName"
              placeholder="Protocol name"
            />
          </label>
          {/* form-label */}

          {/* .label-icon */}
          <input onChange={handleChange} type="file" id="file-upload" className="hidden" />
          <label
            htmlFor="file-upload"
            className="z-20 flex flex-col-reverse items-center justify-center w-full h-full cursor-pointer"
          >
            <p className="z-10 text-xs font-light text-center text-[#19c5e2]">
              Drag &amp; Drop your protocol logo here
            </p>
            <svg
              className="z-10 w-8 h-8 text-indigo-400"
              fill="#19c5e2"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          </label>

          {/* .form-input */}

          {/* .form-label */}

          {/* .form-footer */}
        </form>
        {/* .signup-form */}
      </motion.div>
      {/* .form-wrapper */}
    </div>
  );
};

export default Protocol;
