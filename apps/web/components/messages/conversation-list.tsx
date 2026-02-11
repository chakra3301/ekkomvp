"use client";

import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  currentUserId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function ConversationList({
  currentUserId,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.message.getConversations.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const conversations = data?.pages.flatMap((page) => page.conversations) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm mt-1">
            Message someone from their profile to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const otherUser =
          conversation.participant1.id === currentUserId
            ? conversation.participant2
            : conversation.participant1;

        const lastMessage = conversation.messages[0];
        const isUnread =
          lastMessage &&
          lastMessage.senderId !== currentUserId &&
          !lastMessage.readAt;
        const isSelected = selectedId === conversation.id;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-muted",
              isSelected && "bg-muted",
              isUnread && "bg-primary/5"
            )}
          >
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={otherUser.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {otherUser.profile?.displayName
                  ? getInitials(otherUser.profile.displayName)
                  : "?"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-medium truncate",
                    isUnread && "font-bold"
                  )}
                >
                  {otherUser.profile?.displayName || "User"}
                </span>
                {lastMessage && (
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p
                  className={cn(
                    "text-sm truncate",
                    isUnread
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {lastMessage.senderId === currentUserId && "You: "}
                  {lastMessage.content}
                </p>
              )}
            </div>

            {isUnread && (
              <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
            )}
          </button>
        );
      })}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isFetchingNextPage ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Load more"
          )}
        </button>
      )}
    </div>
  );
}
