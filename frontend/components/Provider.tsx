"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import OfflineRuntime from "@/components/offline/OfflineRuntime";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <OfflineRuntime />
      <Toaster />
    </SessionProvider>
  );
}
