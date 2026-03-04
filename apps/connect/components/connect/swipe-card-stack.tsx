"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Heart, X, MoreHorizontal, ShieldAlert, Flag, MapPin, ArrowLeft, Infinity, Compass, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { ConnectProfileCard } from "./connect-profile-card";
import { ReportDialog } from "./report-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  connectTier?: string | null;
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
  onSwipe: (targetUserId: string, type: "LIKE" | "PASS", matchNote?: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

const TEST_PROFILES: ProfileData[] = [
  {
    id: "test-1",
    userId: "test-user-1",
    headline: "music producer & visual artist",
    lookingFor: "creative collective",
    bio: "Blending sound design with generative visuals. Looking for collaborators who push boundaries.",
    location: "Los Angeles, CA",
    instagramHandle: null,
    twitterHandle: null,
    websiteUrl: null,
    connectTier: null,
    mediaSlots: [
      { url: "/lost angels bw.png", mediaType: "PHOTO", sortOrder: 0 },
      { url: "/lost angels collage.png", mediaType: "PHOTO", sortOrder: 1 },
    ],
    prompts: [{ question: "A project I'm proud of", answer: "Built an immersive audiovisual installation for Art Basel that combined live-coded music with reactive projections." }],
    user: {
      profile: {
        displayName: "Maya Chen",
        avatarUrl: null,
        disciplines: [{ discipline: { name: "Music" } }, { discipline: { name: "Design" } }],
      },
    },
  },
  {
    id: "test-2",
    userId: "test-user-2",
    headline: "cinematographer & editor",
    lookingFor: "directors & storytellers",
    bio: "Narrative-driven DP with a love for natural light. Let's tell stories that matter.",
    location: "New York, NY",
    instagramHandle: null,
    twitterHandle: null,
    websiteUrl: null,
    connectTier: null,
    mediaSlots: [
      { url: "/rider.png", mediaType: "PHOTO", sortOrder: 0 },
    ],
    prompts: [{ question: "What inspires me", answer: "Golden hour, Wong Kar-wai films, and the way strangers move through cities." }],
    user: {
      profile: {
        displayName: "Jordan Ellis",
        avatarUrl: null,
        disciplines: [{ discipline: { name: "Photography" } }, { discipline: { name: "Film" } }],
      },
    },
  },
  {
    id: "test-3",
    userId: "test-user-3",
    headline: "3D artist & creative technologist",
    lookingFor: "brands & studios",
    bio: "Creating surreal digital worlds. Specializing in Blender, Unreal Engine, and motion graphics.",
    location: "Austin, TX",
    instagramHandle: null,
    twitterHandle: null,
    websiteUrl: null,
    connectTier: "INFINITE",
    mediaSlots: [
      { url: "/fd.png", mediaType: "PHOTO", sortOrder: 0 },
    ],
    prompts: [{ question: "My creative superpower", answer: "Turning abstract concepts into tangible 3D experiences that make people stop scrolling." }],
    user: {
      profile: {
        displayName: "Kai Nakamura",
        avatarUrl: null,
        disciplines: [{ discipline: { name: "3D Art" } }, { discipline: { name: "Animation" } }],
      },
    },
  },
];

function SwipeCard({
  profile,
  onSwipe,
  isTop,
  onBlock,
  onReport,
}: {
  profile: ProfileData;
  onSwipe: (type: "LIKE" | "PASS") => void;
  isTop: boolean;
  onBlock: () => void;
  onReport: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 100;
      if (info.offset.x > threshold || info.velocity.x > 500) {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Medium });
        onSwipe("LIKE");
      } else if (info.offset.x < -threshold || info.velocity.x < -500) {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light });
        onSwipe("PASS");
      }
    },
    [onSwipe]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isTop || !cardRef.current || isExpanded) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 10;
      const rotateX = ((centerY - e.clientY) / (rect.height / 2)) * 10;
      setRotation({
        x: Math.max(-10, Math.min(10, rotateX)),
        y: Math.max(-10, Math.min(10, rotateY)),
      });
      if (!isPressed) setIsPressed(true);
    },
    [isTop, isPressed, isExpanded]
  );

  const handlePointerLeave = useCallback(() => {
    setRotation({ x: 0, y: 0 });
    setIsPressed(false);
  }, []);

  const handleCardTap = useCallback(() => {
    if (isTop) setIsExpanded((prev) => !prev);
  }, [isTop]);

  const mediaSlots = (profile.mediaSlots || []) as unknown as MediaSlot[];
  const prompts = (profile.prompts || []) as unknown as PromptEntry[];
  const featuredSlot = mediaSlots.find((s) => s.sortOrder === 0);
  const displayName = profile.user.profile?.displayName || "Creative";
  const disciplines = profile.user.profile?.disciplines?.map((d) => d.discipline.name) || [];

  const accentColor = "211, 100%, 50%";

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop && !isExpanded ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      exit={{ x: 300, opacity: 0, transition: { duration: 0.3 } }}
    >
      {/* Swipe indicators */}
      {isTop && !isExpanded && (
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

      {/* More menu */}
      {isTop && (
        <div className="absolute top-3 right-3 z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                <MoreHorizontal className="h-5 w-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={onBlock}
                className="text-destructive"
              >
                <ShieldAlert className="h-4 w-4 mr-2" />
                Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 3D perspective container */}
      <div
        ref={cardRef}
        className="w-full h-full"
        style={{ perspective: "1000px" }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          animate={{
            rotateX: isExpanded ? 0 : rotation.x,
            rotateY: isExpanded ? 0 : rotation.y,
            scale: isPressed && !isExpanded ? 1.02 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: isPressed && !isExpanded
              ? `0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px hsl(${accentColor} / 0.15)`
              : "0 10px 20px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Shine overlay — collapsed only */}
          {!isExpanded && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
              animate={{ opacity: isPressed ? 0.4 : 0 }}
              style={{
                background: `linear-gradient(
                  ${105 + rotation.y * 3}deg,
                  transparent 30%,
                  rgba(255, 255, 255, 0.2) 45%,
                  rgba(255, 255, 255, 0.3) 50%,
                  rgba(255, 255, 255, 0.2) 55%,
                  transparent 70%
                )`,
              }}
            />
          )}

          {/* Glow border — collapsed only */}
          {!isExpanded && (
            <div
              className="absolute inset-0 z-10 pointer-events-none rounded-2xl transition-opacity duration-300"
              style={{
                border: `1.5px solid hsl(${accentColor} / ${isPressed ? 0.5 : 0.15})`,
                boxShadow: isPressed
                  ? `inset 0 0 30px hsl(${accentColor} / 0.1), 0 0 20px hsl(${accentColor} / 0.15)`
                  : "none",
              }}
            />
          )}

          {/* Ambient glow — collapsed only */}
          {!isExpanded && (
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              animate={{ opacity: isPressed ? 0.3 : 0.1 }}
              style={{
                background: `radial-gradient(ellipse at center, hsl(${accentColor} / 0.1) 0%, transparent 70%)`,
              }}
            />
          )}

          {/* COLLAPSED: Hero image card */}
          {!isExpanded ? (
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={handleCardTap}
            >
              {/* Hero image */}
              {featuredSlot ? (
                <Image
                  src={featuredSlot.url}
                  alt={displayName}
                  fill
                  sizes="(max-width: 512px) 100vw, 512px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary/20">
                    {displayName.charAt(0)}
                  </span>
                </div>
              )}

              {/* Bottom gradient */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Info overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {displayName}
                  {profile.connectTier === "INFINITE" && (
                    <span className="inline-flex items-center gap-0.5 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                      <Infinity className="h-3 w-3" />
                    </span>
                  )}
                </h2>
                {profile.headline && (
                  <p className="text-sm text-white/80 mt-0.5">{profile.headline}</p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-white/70">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </div>
                )}
                {disciplines.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {disciplines.slice(0, 3).map((d) => (
                      <span
                        key={d}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-white/90 backdrop-blur-sm"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EXPANDED: just keep hero visible underneath */
            <div className="relative w-full h-full">
              {featuredSlot ? (
                <Image
                  src={featuredSlot.url}
                  alt={displayName}
                  fill
                  sizes="(max-width: 512px) 100vw, 512px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
                  <span className="text-6xl font-bold text-primary/20">
                    {displayName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* FULL-SCREEN PROFILE OVERLAY */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Back button header */}
            <div className="sticky top-0 z-10 glass-bar safe-top">
              <div className="flex items-center h-[44px] px-4">
                <button
                  onClick={handleCardTap}
                  className="flex items-center gap-1.5 text-primary"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              </div>
            </div>

            {/* Scrollable profile */}
            <div className="overflow-y-auto" style={{ height: "calc(100vh - 44px - env(safe-area-inset-top))" }}>
              <ConnectProfileCard
                displayName={displayName}
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
                connectTier={profile.connectTier}
                className="rounded-none"
              />

              {/* Action buttons at bottom of profile */}
              <div className="flex items-center justify-center gap-6 pt-8 pb-36 px-4">
                <button
                  onClick={() => { setIsExpanded(false); onSwipe("PASS"); }}
                  className="h-14 w-14 rounded-full btn-liquid-glass flex items-center justify-center shadow-lg"
                >
                  <X className="h-6 w-6 text-red-500" />
                </button>
                <button
                  onClick={() => { setIsExpanded(false); onSwipe("LIKE"); }}
                  className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
                >
                  <Heart className="h-7 w-7 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function SwipeCardStack({ profiles, onSwipe, onUndo, canUndo }: SwipeCardStackProps) {
  const activeProfiles = profiles.length > 0 ? profiles : TEST_PROFILES;
  const isTestMode = profiles.length === 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [pendingLike, setPendingLike] = useState<string | null>(null);
  const [likeNote, setLikeNote] = useState("");
  const noteInputRef = useRef<HTMLInputElement>(null);

  const blockUser = trpc.block.block.useMutation();

  const handleSwipe = useCallback(
    (type: "LIKE" | "PASS") => {
      const current = activeProfiles[currentIndex];
      if (!current) return;

      if (type === "LIKE" && !isTestMode) {
        // Show note prompt for likes
        setPendingLike(current.userId);
        setLikeNote("");
        setCurrentIndex((i) => i + 1);
        setTimeout(() => noteInputRef.current?.focus(), 300);
        return;
      }

      if (!isTestMode) {
        onSwipe(current.userId, type);
      }
      setCurrentIndex((i) => i + 1);
    },
    [activeProfiles, currentIndex, onSwipe, isTestMode]
  );

  const submitLike = useCallback(
    (note?: string) => {
      if (!pendingLike) return;
      onSwipe(pendingLike, "LIKE", note?.trim() || undefined);
      setPendingLike(null);
      setLikeNote("");
    },
    [pendingLike, onSwipe]
  );

  const handleBlock = useCallback(
    async (userId: string) => {
      if (userId.startsWith("test-")) return;
      if (!confirm("Block this user? They won't appear in your discovery.")) return;
      try {
        await blockUser.mutateAsync(userId);
        toast.success("User blocked");
        setCurrentIndex((i) => i + 1);
      } catch {
        toast.error("Failed to block user");
      }
    },
    [blockUser]
  );

  const visibleProfiles = activeProfiles.slice(currentIndex, currentIndex + 2);

  if (visibleProfiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full px-6 text-center">
        <div className="glass-card p-8 max-w-sm w-full">
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold font-heading mb-2">You&apos;ve seen everyone</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No new creatives right now. Try expanding your filters in Settings or check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Undo button */}
      {canUndo && onUndo && (
        <div className="absolute top-3 left-4 z-20">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onUndo}
            className="p-2.5 rounded-full glass-card shadow-lg"
          >
            <Undo2 className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>
      )}

      {/* Card stack — fills entire area */}
      <div className="absolute inset-0 mx-4">
        <AnimatePresence>
          {visibleProfiles.map((profile, i) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              isTop={i === 0}
              onBlock={() => handleBlock(profile.userId)}
              onReport={() => setReportTarget(profile.userId)}
            />
          ))}
        </AnimatePresence>
      </div>


      {/* Like note prompt */}
      <AnimatePresence>
        {pendingLike && (
          <motion.div
            className="absolute inset-x-0 z-30 mx-4 mb-4"
            style={{
              bottom:
                "max(0px, calc(var(--keyboard-height, 0px) - 49px - env(safe-area-inset-bottom, 0px)))",
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <p className="text-sm font-semibold">Add a note?</p>
                <span className="text-xs text-muted-foreground ml-auto">Optional</span>
              </div>
              <div className="flex gap-2">
                <input
                  ref={noteInputRef}
                  value={likeNote}
                  onChange={(e) => setLikeNote(e.target.value)}
                  placeholder="Say something nice..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 text-sm rounded-xl bg-background/50 border border-border/50 outline-none focus:border-primary/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitLike(likeNote);
                    }
                  }}
                />
                <button
                  onClick={() => submitLike(likeNote)}
                  className="p-2 rounded-xl bg-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => submitLike()}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report dialog */}
      {reportTarget && (
        <ReportDialog
          targetType="USER"
          targetId={reportTarget}
          open={!!reportTarget}
          onOpenChange={(open) => {
            if (!open) {
              setReportTarget(null);
              setCurrentIndex((i) => i + 1);
            }
          }}
        />
      )}
    </div>
  );
}
