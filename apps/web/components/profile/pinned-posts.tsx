"use client";

import { Pin } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { PostCard } from "@/components/feed/post-card";

interface PinnedPostsProps {
  userId: string;
  showPinAction?: boolean;
}

export function PinnedPosts({ userId, showPinAction }: PinnedPostsProps) {
  const { data: pinnedPosts } = trpc.post.getPinnedByUser.useQuery(userId);

  if (!pinnedPosts || pinnedPosts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Pin className="h-3.5 w-3.5" />
        <span>Pinned</span>
      </div>
      {pinnedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          showPinAction={showPinAction}
          isPinned
        />
      ))}
    </div>
  );
}
