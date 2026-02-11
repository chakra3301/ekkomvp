"use client";

import { Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks";
import { PostCard } from "@/components/feed/post-card";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { PinnedPosts } from "./pinned-posts";

interface ProfilePostsProps {
  userId: string;
}

export function ProfilePosts({ userId }: ProfilePostsProps) {
  const { user: currentUser } = useUser();
  const isOwnProfile = currentUser?.id === userId;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.feed.getUserPosts.useInfiniteQuery(
    { userId, limit: 10, excludePinned: true },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="space-y-4">
      <PinnedPosts userId={userId} showPinAction={isOwnProfile} />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No posts yet</p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showPinAction={isOwnProfile}
            />
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
