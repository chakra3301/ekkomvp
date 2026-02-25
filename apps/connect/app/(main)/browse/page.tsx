"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { BrowseGrid } from "@/components/connect/browse-grid";

export default function BrowsePage() {
  const { user } = useProfile();

  const { data: connectProfile, isLoading: profileLoading } =
    trpc.connectProfile.getCurrent.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: discoveryQueue, isLoading: queueLoading } =
    trpc.connectDiscover.getDiscoveryQueue.useQuery(
      { limit: 20 },
      { enabled: !!connectProfile }
    );

  const swipeMutation = trpc.connectMatch.swipe.useMutation();

  if (profileLoading || queueLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!connectProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <h2 className="text-xl font-bold font-heading mb-2">
            Set Up Your Profile
          </h2>
          <p className="text-muted-foreground mb-6">
            Create your Connect profile to browse creatives.
          </p>
          <Link href="/profile/setup">
            <Button className="w-full">Set Up Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const profiles = discoveryQueue || [];

  return (
    <div>
      <div className="px-4 pt-3 pb-1">
        <h2 className="text-lg font-bold font-heading">Browse Creatives</h2>
      </div>
      <BrowseGrid
        profiles={profiles as any}
        onSelect={async (profile) => {
          try {
            const result = await swipeMutation.mutateAsync({
              targetUserId: profile.userId,
              type: "LIKE",
            });
            if (result.matched) {
              toast.success("It's a Match!", {
                action: {
                  label: "View",
                  onClick: () => (window.location.href = "/matches"),
                },
              });
            } else {
              toast.success("Liked!");
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "Action failed";
            if (message.includes("Daily like limit")) {
              toast.error(message);
            }
          }
        }}
      />
    </div>
  );
}
