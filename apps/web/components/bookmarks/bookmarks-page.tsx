"use client";

import { Bookmark, Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { PostCard } from "@/components/feed/post-card";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { Button } from "@/components/ui/button";

export function BookmarksPage() {
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = trpc.bookmark.getBookmarked.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Bookmark className="h-5 w-5" />
          <h1 className="text-xl font-bold">Bookmarks</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground">
              Save posts for later by tapping the bookmark icon on any post.
            </p>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
