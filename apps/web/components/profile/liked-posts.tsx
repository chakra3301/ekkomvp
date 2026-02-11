"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/post-card";
import { trpc } from "@/lib/trpc/client";

interface LikedPostsProps {
  userId: string;
}

export function LikedPosts({ userId }: LikedPostsProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.feed.getLikedPosts.useInfiniteQuery(
      { userId, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p className="font-medium">No likes yet</p>
        <p className="text-sm mt-1">Posts you like will show up here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
