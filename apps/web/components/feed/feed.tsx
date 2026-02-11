"use client";

import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";
import { PostCreateForm } from "./post-create-form";

export function Feed() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.feed.getChronological.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PostCreateForm />
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load feed. Please try again.
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-6">
      <PostCreateForm />

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full py-4 text-center text-muted-foreground hover:text-foreground"
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                "Load more"
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
