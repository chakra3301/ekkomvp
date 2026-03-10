"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Loader2, Lock, Infinity } from "lucide-react";
import { toast } from "sonner";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/connect/upgrade-modal";
import type { MediaSlot } from "@/components/connect/media-slot-grid";

export default function LikesPage() {
  const { user } = useProfile();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data: connectProfile } = trpc.connectProfile.getCurrent.useQuery(
    undefined,
    { enabled: !!user, staleTime: 1000 * 60 * 5 }
  );

  const { data, isLoading } = trpc.connectDiscover.getLikesReceived.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );

  const swipeMutation = trpc.connectMatch.swipe.useMutation();
  const utils = trpc.useUtils();

  const isInfinite = connectProfile?.connectTier === "INFINITE";

  const handleLikeBack = async (targetUserId: string) => {
    try {
      const result = await swipeMutation.mutateAsync({
        targetUserId,
        type: "LIKE",
      });

      if (result.matched) {
        toast.success("It's a Match!");
      }

      await utils.connectDiscover.getLikesReceived.invalidate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed";
      toast.error(message);
    }
  };

  const handlePass = async (targetUserId: string) => {
    try {
      await swipeMutation.mutateAsync({
        targetUserId,
        type: "PASS",
      });
      await utils.connectDiscover.getLikesReceived.invalidate();
    } catch {
      toast.error("Failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const likes = data?.likes || [];

  if (likes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-heading mb-2">No likes yet</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When someone swipes right on your profile, they&apos;ll show up here. A strong profile with great photos gets more attention.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold font-heading mb-4">
        {likes.length} {likes.length === 1 ? "person" : "people"} liked you
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {likes.map((like) => {
          const mediaSlots = (like.user.connectProfile?.mediaSlots ||
            []) as unknown as MediaSlot[];
          const firstImage = mediaSlots.find((s) => s.mediaType === "PHOTO");
          const displayName = like.user.profile?.displayName || "Creative";

          return (
            <div
              key={like.id}
              className="glass-card rounded-2xl overflow-hidden"
            >
              <div className="relative aspect-[3/4]">
                {firstImage ? (
                  <Image
                    src={firstImage.url}
                    alt={displayName}
                    fill
                    sizes="(max-width: 512px) 50vw, 256px"
                    className={`object-cover ${!isInfinite ? "blur-lg" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span
                      className={`text-3xl font-bold text-muted-foreground ${
                        !isInfinite ? "blur-lg" : ""
                      }`}
                    >
                      {displayName[0]?.toUpperCase()}
                    </span>
                  </div>
                )}

                {!isInfinite && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                    <Lock className="h-8 w-8 text-white mb-2" />
                    <p className="text-white text-xs font-medium">
                      Upgrade to see
                    </p>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white font-semibold text-sm truncate">
                    {isInfinite ? displayName : "???"}
                  </p>
                </div>
              </div>

              {/* Match note */}
              {like.matchNote && isInfinite && (
                <div className="px-3 py-2 text-xs text-muted-foreground italic">
                  &ldquo;{like.matchNote}&rdquo;
                </div>
              )}

              {/* Action buttons */}
              {isInfinite && (
                <div className="flex gap-2 p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handlePass(like.userId)}
                    disabled={swipeMutation.isPending}
                  >
                    Pass
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleLikeBack(like.userId)}
                    disabled={swipeMutation.isPending}
                  >
                    Like Back
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isInfinite && (
        <div className="mt-6 glass-card p-6 text-center">
          <h3 className="font-bold mb-2 flex items-center justify-center gap-1">
            Upgrade to Infinite <Infinity className="h-4 w-4 text-primary" />
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            See who liked you, get unlimited likes, and more.
          </p>
          <Button onClick={() => setUpgradeOpen(true)}>
            <Infinity className="h-4 w-4 mr-2" />
            Go Infinite
          </Button>
        </div>
      )}

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        trigger="See everyone who liked your profile"
      />
    </div>
  );
}
