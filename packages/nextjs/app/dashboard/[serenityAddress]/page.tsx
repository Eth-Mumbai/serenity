"use client";

import { useRouter } from "next/navigation";
import Graph from "./graph";
import {
  IconArrowWaveRightUp,
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";
import { BentoGrid, BentoGridItem } from "~~/components/bentoGrid";

export default function BentoGridDemo({ params }: { params: { slug: string } }) {
  const router = useRouter();

  const items = [
    {
      title: "The Dawn of Innovation",
      description: "Explore the birth of groundbreaking ideas and inventions.",
      header: (
        <div className="flex flex-col justify-center content-center items-center h-full">
          <h1 className="text-2xl">Protocol Status</h1>
          <span className="text-green-600 text-4xl">Active</span>
        </div>
      ),
      icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "The Digital Revolution",
      description: "Dive into the transformative power of technology.",
      header: (
        <div className="flex flex-col justify-center content-center items-center h-full">
          <h1 className="text-2xl">Protocol Liquidity</h1>
          <span className="text-4xl">$30</span>
        </div>
      ),
      icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "The Art of Design",
      description: "Discover the beauty of thoughtful and functional design.",
      header: (
        <div
          onClick={() => router.push("https://testnet.snapshot.org/#/nightfury.eth/create")}
          className="flex justify-center items-center h-full ml-10"
        >
          <div>
            <h1 className="text-2xl">Create a new proposal →</h1>
          </div>
        </div>
      ),
      icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "The Power of Communication",
      description: "Understand the impact of effective communication in our lives.",
      header: <Graph address={params.serenityAddress} />,
      icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
    },
    {
      title: "The Pursuit of Knowledge",
      description: "Join the quest for understanding and enlightenment.",
      header: (
        <div className="flex flex-col justify-center content-center items-center h-full">
          <h1 className="text-2xl">Fees Earned</h1>
          <span className="text-4xl">$2</span>
        </div>
      ),
      icon: <IconArrowWaveRightUp className="h-4 w-4 text-neutral-500" />,
    },
  ];
  return (
    <BentoGrid className="mt-[60px] max-w-4xl mx-auto">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          icon={item.icon}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}
