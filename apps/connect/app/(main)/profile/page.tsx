"use client";

import Link from "next/link";
import { User, Edit3, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ConnectProfileCard } from "@/components/connect/connect-profile-card";
import type { MediaSlot } from "@/components/connect/media-slot-grid";
import type { PromptEntry } from "@/components/connect/prompt-editor";

export default function ConnectProfilePage() {
  const { user } = useProfile();
  const { data: connectProfile, isLoading } =
    trpc.connectProfile.getCurrent.useQuery(undefined, {
      enabled: !!user,
      staleTime: 1000 * 60 * 5,
    });
  const toggleActive = trpc.connectProfile.toggleActive.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) {
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
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold font-heading mb-2">
            No Connect Profile Yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Set up your Connect profile to start discovering and matching with
            creatives.
          </p>
          <Link href="/profile/setup">
            <Button className="w-full">Set Up Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const mediaSlots = (connectProfile.mediaSlots as unknown as MediaSlot[]) || [];
  const prompts = (connectProfile.prompts as unknown as PromptEntry[]) || [];
  const disciplines = connectProfile.user?.profile?.disciplines?.map(
    (d) => ({ name: d.discipline.name })
  );

  const handleToggleActive = async () => {
    try {
      const result = await toggleActive.mutateAsync();
      await utils.connectProfile.getCurrent.invalidate();
      toast.success(
        result.isActive ? "Profile is now visible" : "Profile paused"
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {connectProfile.isActive ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Eye className="h-4 w-4" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <EyeOff className="h-4 w-4" /> Paused
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={toggleActive.isPending}
          >
            {connectProfile.isActive ? "Pause" : "Activate"}
          </Button>
          <Link href="/profile/setup">
            <Button size="sm">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile card preview */}
      <ConnectProfileCard
        displayName={
          connectProfile.user?.profile?.displayName || "Your Name"
        }
        avatarUrl={connectProfile.user?.profile?.avatarUrl}
        headline={connectProfile.headline}
        location={connectProfile.location}
        lookingFor={connectProfile.lookingFor}
        bio={connectProfile.bio}
        mediaSlots={mediaSlots}
        prompts={prompts}
        disciplines={disciplines}
        instagramHandle={connectProfile.instagramHandle}
        twitterHandle={connectProfile.twitterHandle}
        websiteUrl={connectProfile.websiteUrl}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">
            {connectProfile.likesReceivedCount}
          </p>
          <p className="text-xs text-muted-foreground">Likes Received</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold">{connectProfile.matchesCount}</p>
          <p className="text-xs text-muted-foreground">Matches</p>
        </div>
      </div>
    </div>
  );
}
