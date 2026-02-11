"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { PostCard } from "@/components/feed/post-card";

interface CollectivePostsFeedProps {
  collectiveId: string;
}

export function CollectivePostsFeed({ collectiveId }: CollectivePostsFeedProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.collective.getCollectivePosts.useInfiniteQuery(
      { collectiveId, limit: 20 },
      { getNextPageParam: (last) => last.nextCursor }
    );

  const posts = data?.pages.flatMap((p) => p.posts) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts yet. Be the first to post!</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post as any} />
      ))}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
