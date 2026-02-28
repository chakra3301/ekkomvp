"use client";

import Link from "next/link";
import { MessageCircle, Loader2 } from "lucide-react";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";

export default function MatchesPage() {
  const { user } = useProfile();

  const { data, isLoading } = trpc.connectMatch.getMatches.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const matches = data?.matches || [];

  // Separate new matches (no messages) and conversations
  const newMatches = matches.filter((m) => !m.lastMessage);
  const conversations = matches.filter((m) => m.lastMessage);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold font-heading mb-2">Matches</h2>
          <p className="text-muted-foreground">
            Your matches and conversations will appear here. Keep swiping to
            find your creative match!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* New Matches (horizontal scroll) */}
      {newMatches.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            New Matches
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {newMatches.map((match) => {
              const displayName =
                match.otherUser.profile?.displayName || "User";
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex flex-col items-center gap-1 flex-shrink-0"
                >
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/30">
                      <AvatarImage
                        src={match.otherUser.profile?.avatarUrl || undefined}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-xs font-medium truncate max-w-[64px]">
                    {displayName.split(" ")[0]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div>
        {conversations.length > 0 && (
          <h3 className="text-sm font-semibold text-muted-foreground px-4 pt-3 pb-1">
            Messages
          </h3>
        )}
        {conversations.map((match) => {
          const displayName =
            match.otherUser.profile?.displayName || "User";
          return (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/60"
            >
              <Avatar className="h-14 w-14">
                <AvatarImage
                  src={match.otherUser.profile?.avatarUrl || undefined}
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold truncate">{displayName}</p>
                  {match.lastMessage && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatRelativeTime(match.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {match.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {match.lastMessage.senderId === user?.id ? "You: " : ""}
                    {match.lastMessage.content}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
