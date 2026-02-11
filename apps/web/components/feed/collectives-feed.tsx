"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, Users2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { PostCard } from "./post-card";

export function CollectivesFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: collectives, isLoading: collectivesLoading } =
    trpc.collective.getMyCollectives.useQuery();

  const {
    data: feedData,
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.feed.getCollectivesFeed.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const posts = feedData?.pages.flatMap((page) => page.posts) ?? [];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (collectivesLoading || feedLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collectives || collectives.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-lg font-medium">No collectives yet</p>
        <p className="text-sm mt-1">
          Join or create a collective to see posts here.
        </p>
        <Link href="/collectives">
          <Button variant="outline" className="mt-4">
            Browse Collectives
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collectives Carousel */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Your Collectives</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => scroll("left")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => scroll("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {collectives.map((collective) => (
            <Link
              key={collective.id}
              href={`/collectives/${collective.slug}`}
              className="flex-shrink-0 w-[200px]"
            >
              <div className="group rounded-lg border border-border overflow-hidden transition-shadow hover:shadow-md bg-card">
                {/* Mini banner */}
                <div className="h-16 bg-muted relative overflow-hidden">
                  {collective.bannerUrl ? (
                    <Image
                      src={collective.bannerUrl}
                      alt={collective.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                </div>
                <div className="px-3 py-2">
                  <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                    {collective.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {collective.membersCount} {collective.membersCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No posts from your collectives yet.</p>
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
