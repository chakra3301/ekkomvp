"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";
import { cn } from "@/lib/utils";

interface MessagesViewProps {
  currentUserId: string;
}

export function MessagesView({ currentUserId }: MessagesViewProps) {
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );

  // Sync with URL param on mount
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Conversation List - hidden on mobile when a thread is selected */}
      <div
        className={cn(
          "w-full md:w-80 md:border-r border-border flex-shrink-0 flex flex-col",
          selectedConversationId && "hidden md:flex"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </header>

        <ConversationList
          currentUserId={currentUserId}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Message Thread - hidden on mobile when no thread selected */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !selectedConversationId && "hidden md:flex"
        )}
      >
        {selectedConversationId ? (
          <>
            {/* Mobile back button */}
            <div className="md:hidden">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted transition-colors w-full border-b border-border"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            </div>
            <MessageThread
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
