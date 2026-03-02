"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeChat(
  matchId: string,
  userId: string | undefined
) {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [newMessageSignal, setNewMessageSignal] = useState(0);
  const [readSignal, setReadSignal] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    if (!matchId || !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(`chat:${matchId}`);

    // Listen for new messages via postgres_changes
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "connect_messages",
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        if (payload.new.sender_id !== userId) {
          setNewMessageSignal((prev) => prev + 1);
        }
      }
    );

    // Listen for typing indicators via broadcast
    channel.on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload?.userId !== userId) {
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(
          () => setIsOtherTyping(false),
          3000
        );
      }
    });

    // Listen for read receipt signals
    channel.on("broadcast", { event: "read" }, (payload) => {
      if (payload.payload?.userId !== userId) {
        setReadSignal((prev) => prev + 1);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [matchId, userId]);

  // Broadcast typing event (throttled to once every 2s)
  const sendTyping = useCallback(() => {
    if (!channelRef.current || !userId) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });
  }, [userId]);

  // Broadcast read receipt
  const sendRead = useCallback(() => {
    if (!channelRef.current || !userId) return;

    channelRef.current.send({
      type: "broadcast",
      event: "read",
      payload: { userId },
    });
  }, [userId]);

  return { isOtherTyping, newMessageSignal, readSignal, sendTyping, sendRead };
}
