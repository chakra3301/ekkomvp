"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { MessageInput } from "./message-input";

interface MessageThreadProps {
  conversationId: string;
  currentUserId: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function MessageThread({
  conversationId,
  currentUserId,
}: MessageThreadProps) {
  const utils = trpc.useUtils();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.message.getMessages.useInfiniteQuery(
      { conversationId, limit: 30 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const markAsRead = trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      utils.message.getUnreadCount.invalidate();
      utils.message.getConversations.invalidate();
    },
  });

  const sendMessage = trpc.message.sendMessage.useMutation({
    onSuccess: () => {
      utils.message.getMessages.invalidate({ conversationId });
      utils.message.getConversations.invalidate();
      // Scroll to bottom after sending
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    },
  });

  // Messages come in reverse chronological order from the API, so reverse for display
  const messages = [
    ...(data?.pages.flatMap((page) => page.messages) ?? []),
  ].reverse();

  // Mark as read on mount and when conversation changes
  useEffect(() => {
    markAsRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.pages[0]?.messages[0]?.id, isLoading]);

  const handleSend = (content: string) => {
    sendMessage.mutate({ conversationId, content });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4">
        {/* Load more button */}
        {hasNextPage && (
          <div className="flex justify-center mb-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Load older messages"
              )}
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              const isOwn = message.sender.id === currentUserId;
              const showAvatar =
                !isOwn &&
                (index === 0 || messages[index - 1]?.sender.id !== message.sender.id);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Other user avatar */}
                  {!isOwn && (
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={message.sender.profile?.avatarUrl || undefined}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {message.sender.profile?.displayName
                              ? getInitials(message.sender.profile.displayName)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(message.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} isSending={sendMessage.isPending} />
    </div>
  );
}
