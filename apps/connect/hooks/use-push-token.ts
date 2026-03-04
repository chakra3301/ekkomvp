"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";

export function usePushToken(userId: string | undefined) {
  const savedRef = useRef(false);
  const saveMutation = trpc.notification.savePushToken.useMutation();

  useEffect(() => {
    if (!userId || savedRef.current) return;

    const save = () => {
      const token = localStorage.getItem("ekko-push-token");
      if (!token || savedRef.current) return;
      savedRef.current = true;
      saveMutation.mutate({ token, platform: "ios" });
    };

    // Try immediately (token may already be in localStorage)
    save();

    // Also listen for the event from native-bridge
    window.addEventListener("ekko-push-token", save);
    return () => window.removeEventListener("ekko-push-token", save);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
}
