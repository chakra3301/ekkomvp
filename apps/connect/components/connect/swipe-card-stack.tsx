"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ConnectProfileCard } from "./connect-profile-card";
import type { MediaSlot } from "./media-slot-grid";
import type { PromptEntry } from "./prompt-editor";

interface ProfileData {
  id: string;
  userId: string;
  headline: string | null;
  lookingFor: string | null;
  bio: string | null;
  location: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  mediaSlots: MediaSlot[];
  prompts: PromptEntry[];
  user: {
    profile: {
      displayName: string;
      avatarUrl: string | null;
      disciplines: { discipline: { name: string } }[];
    } | null;
  };
}

interface SwipeCardStackProps {
  profiles: ProfileData[];
  onSwipe: (targetUserId: string, type: "LIKE" | "PASS") => void;
}

function SwipeCard({
  profile,
  onSwipe,
  isTop,
}: {
  profile: ProfileData;
  onSwipe: (type: "LIKE" | "PASS") => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 100;
      if (info.offset.x > threshold || info.velocity.x > 500) {
        onSwipe("LIKE");
      } else if (info.offset.x < -threshold || info.velocity.x < -500) {
        onSwipe("PASS");
      }
    },
    [onSwipe]
  );

  const mediaSlots = (profile.mediaSlots || []) as unknown as MediaSlot[];
  const prompts = (profile.prompts || []) as unknown as PromptEntry[];

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Swipe indicators */}
      {isTop && (
        <>
          <motion.div
            className="absolute top-8 right-8 z-20 btn-liquid-glass text-primary font-bold text-2xl px-6 py-2 rounded-xl border-2 border-primary/40 rotate-[-20deg]"
            style={{ opacity: likeOpacity }}
          >
            LIKE
          </motion.div>
          <motion.div
            className="absolute top-8 left-8 z-20 btn-liquid-glass text-red-500 font-bold text-2xl px-6 py-2 rounded-xl border-2 border-red-400/40 rotate-[20deg]"
            style={{ opacity: passOpacity }}
          >
            PASS
          </motion.div>
        </>
      )}

      <div className="h-full overflow-y-auto rounded-3xl">
        <ConnectProfileCard
          displayName={profile.user.profile?.displayName || "Creative"}
          avatarUrl={profile.user.profile?.avatarUrl}
          headline={profile.headline}
          location={profile.location}
          lookingFor={profile.lookingFor}
          bio={profile.bio}
          mediaSlots={mediaSlots}
          prompts={prompts}
          disciplines={profile.user.profile?.disciplines?.map((d) => ({
            name: d.discipline.name,
          }))}
          instagramHandle={profile.instagramHandle}
          twitterHandle={profile.twitterHandle}
          websiteUrl={profile.websiteUrl}
          className="min-h-full"
        />
      </div>
    </motion.div>
  );
}

export function SwipeCardStack({ profiles, onSwipe }: SwipeCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (type: "LIKE" | "PASS") => {
      const current = profiles[currentIndex];
      if (!current) return;
      onSwipe(current.userId, type);
      setCurrentIndex((i) => i + 1);
    },
    [profiles, currentIndex, onSwipe]
  );

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);

  if (visibleProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <h3 className="text-lg font-bold mb-2">No more profiles</h3>
          <p className="text-sm text-muted-foreground">
            Check back later for new creatives in your area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-10rem)]">
      {/* Card stack */}
      <div className="relative flex-1 mx-4">
        <AnimatePresence>
          {visibleProfiles.map((profile, i) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button
          onClick={() => handleSwipe("PASS")}
          className="w-14 h-14 rounded-full btn-liquid-glass flex items-center justify-center hover:border-red-400/50 transition-all press-effect"
        >
          <X className="h-7 w-7 text-red-500" />
        </button>
        <button
          onClick={() => handleSwipe("LIKE")}
          className="w-16 h-16 rounded-full btn-liquid-glass flex items-center justify-center hover:border-primary/50 transition-all press-effect"
        >
          <Heart className="h-8 w-8 text-primary" />
        </button>
      </div>
    </div>
  );
}
