"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutGrid, Layers, Loader2, History } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { SwipeCardStack } from "@/components/connect/swipe-card-stack";
import { BrowseGrid } from "@/components/connect/browse-grid";
import { HistoryGrid } from "@/components/connect/history-grid";

const FILTER_KEY = "ekko-connect-filters";

interface DiscoveryFilters {
  city: string;
  maxDistanceMiles: number;
  globalSearch: boolean;
  role: "ALL" | "CREATIVE" | "CLIENT";
}

function loadFilters(): DiscoveryFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(FILTER_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export default function DiscoverPage() {
  const [viewMode, setViewMode] = useState<"stack" | "grid" | "history">("stack");
  const [filters, setFilters] = useState<DiscoveryFilters | null>(null);
  const { user } = useProfile();

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  const { data: connectProfile, isLoading: profileLoading } =
    trpc.connectProfile.getCurrent.useQuery(undefined, {
      enabled: !!user,
    });

  // Build query filters from localStorage settings + profile GPS
  const queryFilters = (() => {
    const f: Record<string, unknown> = {};
    if (filters?.role && filters.role !== "ALL") f.role = filters.role;
    if (filters?.city) f.location = filters.city;
    if (filters?.globalSearch) {
      f.globalSearch = true;
    } else if (
      connectProfile?.latitude != null &&
      connectProfile?.longitude != null &&
      filters?.maxDistanceMiles
    ) {
      f.latitude = connectProfile.latitude;
      f.longitude = connectProfile.longitude;
      f.maxDistanceMiles = filters.maxDistanceMiles;
    }
    return Object.keys(f).length > 0 ? f : undefined;
  })();

  const { data: discoveryQueue, isLoading: queueLoading } =
    trpc.connectDiscover.getDiscoveryQueue.useQuery(
      { limit: 10, filters: queryFilters as any },
      { enabled: !!connectProfile }
    );

  // History view data
  const { data: historyData, isLoading: historyLoading } =
    trpc.connectDiscover.getSwipeHistory.useQuery(
      { limit: 20 },
      { enabled: !!connectProfile && viewMode === "history" }
    );

  const swipeMutation = trpc.connectMatch.swipe.useMutation();

  const handleSwipe = async (targetUserId: string, type: "LIKE" | "PASS") => {
    try {
      const result = await swipeMutation.mutateAsync({
        targetUserId,
        type,
      });

      if (result.matched) {
        toast.success("It's a Match! You can now chat.", {
          action: {
            label: "View",
            onClick: () => (window.location.href = "/matches"),
          },
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Swipe failed";
      if (message.includes("Daily like limit")) {
        toast.error(message);
      }
    }
  };

  // Loading states
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No Connect profile yet
  if (!connectProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <h2 className="text-2xl font-bold font-heading mb-2">
            Welcome to Connect
          </h2>
          <p className="text-muted-foreground mb-6">
            Find your creative match. Set up your profile to start discovering
            collaborators, clients, and creatives.
          </p>
          <Link href="/profile/setup">
            <Button className="w-full" size="lg">
              Set Up Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const profiles = discoveryQueue || [];

  return (
    <div>
      {/* View mode toggle */}
      <div className="flex justify-end px-4 py-2">
        <div className="flex gap-1 p-1 glass-card">
          <button
            onClick={() => setViewMode("stack")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "stack"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("history")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "history"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "history" ? (
        historyLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <HistoryGrid profiles={(historyData?.items || []) as any} />
        )
      ) : queueLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : viewMode === "stack" ? (
        <SwipeCardStack profiles={profiles as any} onSwipe={handleSwipe} />
      ) : (
        <BrowseGrid
          profiles={profiles as any}
          onSelect={(profile) => {
            handleSwipe(profile.userId, "LIKE");
          }}
        />
      )}
    </div>
  );
}
