"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { MediaSlot } from "./media-slot-grid";

interface ProfileData {
  id: string;
  userId: string;
  headline: string | null;
  location: string | null;
  mediaSlots: MediaSlot[];
  user: {
    profile: {
      displayName: string;
      avatarUrl: string | null;
      disciplines: { discipline: { name: string } }[];
    } | null;
  };
}

interface BrowseGridProps {
  profiles: ProfileData[];
  onSelect: (profile: ProfileData) => void;
}

export function BrowseGrid({ profiles, onSelect }: BrowseGridProps) {
  if (profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4 text-center">
        <p className="text-muted-foreground">No profiles to browse right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {profiles.map((profile) => {
        const mediaSlots = (profile.mediaSlots || []) as unknown as MediaSlot[];
        const firstImage = mediaSlots.find((s) => s.mediaType === "PHOTO");

        return (
          <button
            key={profile.id}
            onClick={() => onSelect(profile)}
            className="glass-card overflow-hidden rounded-2xl text-left transition-transform hover:scale-[1.02] press-effect"
          >
            <div className="relative aspect-[3/4]">
              {firstImage ? (
                <Image
                  src={firstImage.url}
                  alt={profile.user.profile?.displayName || "Profile"}
                  fill
                  sizes="(max-width: 512px) 50vw, 256px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-3xl font-bold text-muted-foreground">
                    {profile.user.profile?.displayName?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white font-semibold text-sm truncate">
                  {profile.user.profile?.displayName || "Creative"}
                </p>
                {profile.headline && (
                  <p className="text-white/70 text-xs truncate">
                    {profile.headline}
                  </p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1 mt-0.5 text-white/60 text-xs">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>

            {/* Discipline badges */}
            {profile.user.profile?.disciplines &&
              profile.user.profile.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2">
                  {profile.user.profile.disciplines.slice(0, 2).map((d) => (
                    <Badge
                      key={d.discipline.name}
                      variant="glass"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {d.discipline.name}
                    </Badge>
                  ))}
                </div>
              )}
          </button>
        );
      })}
    </div>
  );
}
