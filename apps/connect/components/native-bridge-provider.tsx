"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function NativeBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Mark the document as native so CSS can apply safe-area padding
      document.documentElement.classList.add("native-app");
      import("@/lib/native-bridge").then(({ initNativeBridge }) => {
        initNativeBridge();
      });
    }
  }, []);

  return <>{children}</>;
}
