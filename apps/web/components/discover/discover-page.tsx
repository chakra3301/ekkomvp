"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, TrendingUp, Hash } from "lucide-react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { PostCard } from "@/components/feed/post-card";
import { PostCardSkeleton } from "@/components/feed/post-card-skeleton";
import { CreativeCard } from "./creative-card";
import { CreativeCardSkeleton } from "./creative-card-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type SearchTab = "creatives" | "posts" | "collectives";

export function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagParam = searchParams.get("tag");

  const [searchQuery, setSearchQuery] = useState(tagParam ? `#${tagParam}` : "");
  const [activeTab, setActiveTab] = useState<SearchTab>(tagParam ? "posts" : "creatives");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [availability, setAvailability] = useState<string>("all");

  const debouncedQuery = useDebounce(searchQuery, 300);
  const hasQuery = debouncedQuery.length > 0;

  // Handle tag param changes
  useEffect(() => {
    if (tagParam) {
      setSearchQuery(`#${tagParam}`);
      setActiveTab("posts");
    }
  }, [tagParam]);

  const { data: disciplines } = trpc.search.getDisciplines.useQuery();

  // Trending data (only when no search query)
  const { data: trendingTags } = trpc.trending.getTrendingTags.useQuery(undefined, {
    enabled: !hasQuery,
  });
  const trendingPostsQuery = trpc.trending.getTrendingPosts.useInfiniteQuery(
    { limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !hasQuery && activeTab !== "creatives",
    }
  );

  // Creatives query (always active on creatives tab)
  const creativesQuery = trpc.search.searchCreatives.useInfiniteQuery(
    {
      query: debouncedQuery || undefined,
      disciplines: selectedDiscipline && selectedDiscipline !== "all" ? [selectedDiscipline] : undefined,
      availability: availability && availability !== "all" ? (availability as "AVAILABLE" | "BUSY" | "NOT_AVAILABLE") : undefined,
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "creatives",
    }
  );

  // Posts query (when tab active and has query OR tag param)
  const postsQuery = trpc.search.searchPosts.useInfiniteQuery(
    {
      query: debouncedQuery.startsWith("#") ? debouncedQuery : debouncedQuery,
      tag: tagParam || (debouncedQuery.startsWith("#") ? debouncedQuery.slice(1).toLowerCase() : undefined),
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "posts" && hasQuery,
    }
  );

  // Collectives query (only when tab active and has query)
  const collectivesQuery = trpc.search.searchCollectives.useInfiniteQuery(
    { query: debouncedQuery, limit: 12 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: activeTab === "collectives" && hasQuery,
    }
  );

  const profiles = creativesQuery.data?.pages.flatMap((page) => page.profiles) ?? [];
  const posts = postsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const trendingPosts = trendingPostsQuery.data?.pages.flatMap((page) => page.posts) ?? [];
  const collectives = collectivesQuery.data?.pages.flatMap((page) => page.collectives) ?? [];

  const tabs: { key: SearchTab; label: string }[] = [
    { key: "creatives", label: "Creatives" },
    { key: "posts", label: "Posts" },
    { key: "collectives", label: "Collectives" },
  ];

  const handleTagClick = (tag: string) => {
    setSearchQuery(`#${tag}`);
    setActiveTab("posts");
    router.push(`/discover?tag=${tag}`);
  };

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Explore</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search creatives, posts, collectives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-lg bg-muted border-0"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters (only show for creatives tab) */}
        {activeTab === "creatives" && (
          <div className="px-4 py-3 flex gap-2 overflow-x-auto">
            <Select
              value={selectedDiscipline}
              onValueChange={setSelectedDiscipline}
            >
              <SelectTrigger className="w-[160px] rounded-lg h-9 text-sm">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disciplines</SelectItem>
                {disciplines?.map((discipline) => (
                  <SelectItem key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-[140px] rounded-lg h-9 text-sm">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="BUSY">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {/* Results */}
      <div className="px-4 py-4">
        {/* Trending Section (when no search query and not on creatives tab) */}
        {!hasQuery && activeTab !== "creatives" && (
          <div className="space-y-6">
            {/* Trending Tags */}
            {trendingTags && trendingTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Trending Tags</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((item) => (
                    <button
                      key={item.tag}
                      onClick={() => handleTagClick(item.tag)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                    >
                      <Hash className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{item.tag}</span>
                      <span className="text-muted-foreground text-xs">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Posts */}
            {activeTab === "posts" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Trending Posts</h2>
                </div>
                {trendingPostsQuery.isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : trendingPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No trending posts yet. Check back later!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trendingPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {trendingPostsQuery.hasNextPage && (
                      <div className="flex justify-center py-4">
                        <Button
                          variant="outline"
                          onClick={() => trendingPostsQuery.fetchNextPage()}
                          disabled={trendingPostsQuery.isFetchingNextPage}
                          className="rounded-lg"
                        >
                          {trendingPostsQuery.isFetchingNextPage ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Show more
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collectives - no search prompt */}
            {activeTab === "collectives" && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Search for collectives</p>
                <p className="text-sm mt-1">Type a query above to find collectives</p>
              </div>
            )}
          </div>
        )}

        {/* Creatives Tab */}
        {activeTab === "creatives" && (
          <>
            {creativesQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CreativeCardSkeleton key={i} />
                ))}
              </div>
            ) : creativesQuery.error ? (
              <div className="text-center py-12 text-muted-foreground">
                Failed to load creatives. Please try again.
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No creatives found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {profiles.map((profile) => (
                    <CreativeCard key={profile.id} profile={profile} />
                  ))}
                </div>

                {creativesQuery.hasNextPage && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => creativesQuery.fetchNextPage()}
                      disabled={creativesQuery.isFetchingNextPage}
                      className="rounded-lg"
                    >
                      {creativesQuery.isFetchingNextPage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Show more
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Posts Tab (with search results) */}
        {activeTab === "posts" && hasQuery && (
          <>
            {postsQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No posts found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}

                {postsQuery.hasNextPage && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={() => postsQuery.fetchNextPage()}
                      disabled={postsQuery.isFetchingNextPage}
                      className="rounded-lg"
                    >
                      {postsQuery.isFetchingNextPage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Show more
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Collectives Tab (with search results) */}
        {activeTab === "collectives" && hasQuery && (
          <>
            {collectivesQuery.isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CreativeCardSkeleton key={i} />
                ))}
              </div>
            ) : collectives.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">No collectives found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {collectives.map((collective) => (
                    <Link key={collective.id} href={`/collectives/${collective.slug}`}>
                      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-4">
                          <h3 className="font-medium group-hover:text-accent transition-colors">
                            {collective.name}
                          </h3>
                          {collective.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {collective.description}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {collective._count.members} {collective._count.members === 1 ? "member" : "members"}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {collective.joinType.toLowerCase().replace("_", " ")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {collectivesQuery.hasNextPage && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => collectivesQuery.fetchNextPage()}
                      disabled={collectivesQuery.isFetchingNextPage}
                      className="rounded-lg"
                    >
                      {collectivesQuery.isFetchingNextPage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Show more
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
