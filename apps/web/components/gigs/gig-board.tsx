"use client";

import { useState } from "react";
import { Search, Loader2, Plus, Briefcase } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { useDebounce } from "@/hooks/use-debounce";
import { useProfile } from "@/hooks";
import { GigCard } from "./gig-card";
import { CreateGigModal } from "./create-gig-modal";

export function GigBoard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetType, setBudgetType] = useState<string>("all");
  const [locationType, setLocationType] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const { profile } = useProfile();
  const isClient = profile?.user?.role === "CLIENT";

  const { data: disciplines } = trpc.search.getDisciplines.useQuery();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.project.getAll.useInfiniteQuery(
    {
      search: debouncedQuery || undefined,
      disciplineId: selectedDiscipline !== "all" ? selectedDiscipline : undefined,
      budgetType: budgetType !== "all" ? (budgetType as "FIXED" | "HOURLY" | "MILESTONE") : undefined,
      locationType: locationType !== "all" ? (locationType as "REMOTE" | "ONSITE" | "HYBRID") : undefined,
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Gig Board</h1>
          {isClient && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Post Gig
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search gigs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 rounded-lg bg-muted border-0"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
            <SelectTrigger className="w-[160px] rounded-lg h-9 text-sm">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disciplines</SelectItem>
              {disciplines?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={budgetType} onValueChange={setBudgetType}>
            <SelectTrigger className="w-[140px] rounded-lg h-9 text-sm">
              <SelectValue placeholder="Budget Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Budget</SelectItem>
              <SelectItem value="FIXED">Fixed Price</SelectItem>
              <SelectItem value="HOURLY">Hourly</SelectItem>
              <SelectItem value="MILESTONE">Milestone</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationType} onValueChange={setLocationType}>
            <SelectTrigger className="w-[130px] rounded-lg h-9 text-sm">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Location</SelectItem>
              <SelectItem value="REMOTE">Remote</SelectItem>
              <SelectItem value="ONSITE">On-site</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Results */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load gigs. Please try again.
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No gigs found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <GigCard key={project.id} project={project} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-lg"
                >
                  {isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {isClient && (
        <CreateGigModal open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
