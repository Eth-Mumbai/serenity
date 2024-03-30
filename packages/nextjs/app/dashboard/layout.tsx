import React from "react";
import { BackgroundBeams } from "./bg";

export default function DashboardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-900">
      <div className="z-40 h-[700px] overflow-scroll">{children}</div>

      <BackgroundBeams />
    </div>
  );
}
