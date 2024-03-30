import React from "react";
import { LampContainer } from "./bg";

export default function SetupLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-900">
      <LampContainer>{children}</LampContainer>
    </div>
  );
}
