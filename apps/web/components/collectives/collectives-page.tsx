"use client";

import { useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { useDebounce } from "@/hooks";
import { CollectiveCard } from "./collective-card";
import { CreateCollectiveModal } from "./create-collective-modal";

export function CollectivesPage() {
  const { user } = useProfile();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const allQuery = trpc.collective.getAll.useInfiniteQuery(
    { search: debouncedSearch || undefined, limit: 12 },
    {
      getNextPageParam: (last) => last.nextCursor,
      enabled: filter === "all",
    }
  );

  const myQuery = trpc.collective.getMyCollectives.useQuery(undefined, {
    enabled: filter === "my" && !!user,
  });

  const collectives =
    filter === "all"
      ? allQuery.data?.pages.flatMap((p) => p.collectives) || []
      : myQuery.data || [];

  const isLoading = filter === "all" ? allQuery.isLoading : myQuery.isLoading;
  const hasMore = filter === "all" && allQuery.hasNextPage;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Collectives</h1>
          {user && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collectives..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {user && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "ghost"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filter === "my" ? "default" : "ghost"}
                onClick={() => setFilter("my")}
              >
                My
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collectives.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No collectives found</p>
            <p className="text-sm mt-1">
              {filter === "my"
                ? "You haven't joined any collectives yet."
                : "Be the first to create one!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {collectives.map((collective) => (
                <CollectiveCard key={collective.id} collective={collective as any} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => allQuery.fetchNextPage()}
                  disabled={allQuery.isFetchingNextPage}
                >
                  {allQuery.isFetchingNextPage ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateCollectiveModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
