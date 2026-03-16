"use client";

import Image from "next/image";
import { MapPin, Video, Music, Globe, Infinity, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isVideoUrl, isAudioUrl, isModelUrl } from "@/lib/supabase/storage";
import { ModelViewerSlot } from "./model-viewer-slot";
import type { MediaSlot } from "./media-slot-grid";
import type { PromptEntry } from "./prompt-editor";

interface ConnectProfileCardProps {
  displayName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  lookingFor?: string | null;
  bio?: string | null;
  mediaSlots: MediaSlot[];
  prompts: PromptEntry[];
  disciplines?: { name: string }[];
  instagramHandle?: string | null;
  twitterHandle?: string | null;
  websiteUrl?: string | null;
  connectTier?: string | null;
  className?: string;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FullWidthMedia({ slot }: { slot: MediaSlot }) {
  const isAudio = slot.mediaType === "AUDIO" || isAudioUrl(slot.url);
  const isModel = slot.mediaType === "MODEL" || isModelUrl(slot.url);
  const isVideo = slot.mediaType === "VIDEO" || isVideoUrl(slot.url);

  if (isAudio) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 px-5 py-6 flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Music className="h-6 w-6 text-primary" />
        </div>
        <audio src={slot.url} controls className="flex-1 h-10" />
      </div>
    );
  }

  if (isModel) {
    return (
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
        <ModelViewerSlot src={slot.url} isFeatured />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
        <video
          src={slot.url}
          className="w-full h-full object-cover"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1">
          <Video className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    );
  }

  // Photo — full width
  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
      <Image
        src={slot.url}
        alt="Media"
        fill
        sizes="(max-width: 512px) 100vw, 512px"
        className="object-cover"
      />
    </div>
  );
}

function renderHeroMedia(slot: MediaSlot) {
  if (slot.mediaType === "AUDIO" || isAudioUrl(slot.url)) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex flex-col items-center justify-center gap-2">
        <Music className="h-12 w-12 text-primary" />
        <audio src={slot.url} controls className="w-[85%] h-8" />
      </div>
    );
  }

  if (slot.mediaType === "MODEL" || isModelUrl(slot.url)) {
    return <ModelViewerSlot src={slot.url} isFeatured />;
  }

  if (slot.mediaType === "VIDEO" || isVideoUrl(slot.url)) {
    return (
      <>
        <video
          src={slot.url}
          className="w-full h-full object-cover"
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1">
          <Video className="h-3.5 w-3.5 text-white" />
        </div>
      </>
    );
  }

  return (
    <Image
      src={slot.url}
      alt="Media"
      fill
      sizes="(max-width: 512px) 100vw, 512px"
      className="object-cover"
    />
  );
}

export function ConnectProfileCard({
  displayName,
  headline,
  location,
  lookingFor,
  bio,
  mediaSlots,
  prompts,
  disciplines,
  instagramHandle,
  twitterHandle,
  websiteUrl,
  connectTier,
  className,
}: ConnectProfileCardProps) {
  const featuredSlot = mediaSlots.find((s) => s.sortOrder === 0);
  const additionalMedia = mediaSlots.filter((s) => s.sortOrder > 0).sort((a, b) => a.sortOrder - b.sortOrder);
  const activePrompts = prompts.filter((p) => p.answer);
  const hasSocials = instagramHandle || twitterHandle || websiteUrl;

  // Interleave media and prompts: media, prompt, media, prompt...
  const interleaved: { type: "media"; slot: MediaSlot }[] | { type: "prompt"; prompt: PromptEntry; index: number }[] = [];
  const maxLen = Math.max(additionalMedia.length, activePrompts.length);
  const items: Array<{ type: "media"; slot: MediaSlot } | { type: "prompt"; prompt: PromptEntry; index: number }> = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < additionalMedia.length) {
      items.push({ type: "media", slot: additionalMedia[i] });
    }
    if (i < activePrompts.length) {
      items.push({ type: "prompt", prompt: activePrompts[i], index: i });
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden bg-card glass-card",
        className
      )}
    >
      {/* Hero Media */}
      {featuredSlot && (
        <div className="relative aspect-[3/4]">
          {renderHeroMedia(featuredSlot)}

          {(featuredSlot.mediaType === "PHOTO" || featuredSlot.mediaType === "VIDEO") && (
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          )}

          <div className={cn(
            "absolute bottom-0 inset-x-0 p-5",
            featuredSlot.mediaType === "PHOTO" || featuredSlot.mediaType === "VIDEO"
              ? "text-white"
              : "text-foreground"
          )}>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {displayName}
              {connectTier === "INFINITE" && (
                <span className="inline-flex items-center gap-0.5 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                  <Infinity className="h-3 w-3" />
                </span>
              )}
            </h2>
            {headline && (
              <p className={cn(
                "text-sm mt-0.5",
                featuredSlot.mediaType === "PHOTO" || featuredSlot.mediaType === "VIDEO"
                  ? "text-white/80"
                  : "text-muted-foreground"
              )}>{headline}</p>
            )}
            {location && (
              <div className={cn(
                "flex items-center gap-1 mt-1 text-sm",
                featuredSlot.mediaType === "PHOTO" || featuredSlot.mediaType === "VIDEO"
                  ? "text-white/70"
                  : "text-muted-foreground"
              )}>
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bio + Looking For + Disciplines */}
      <div className="p-5 space-y-4">
        {bio && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              About
            </p>
            <p className="text-sm whitespace-pre-line">{bio}</p>
          </div>
        )}

        {lookingFor && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Looking for
            </p>
            <p className="text-sm">{lookingFor}</p>
          </div>
        )}

        {disciplines && disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {disciplines.map((d) => (
              <Badge key={d.name} variant="glass" className="text-xs">
                {d.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Interleaved media + prompts */}
      {items.length > 0 && (
        <div className="space-y-4 px-5 pb-5">
          {items.map((item, i) =>
            item.type === "media" ? (
              <FullWidthMedia key={`media-${item.slot.sortOrder}`} slot={item.slot} />
            ) : (
              <div key={`prompt-${item.index}`} className="glass-card p-4 rounded-xl">
                <p className="text-xs font-medium text-primary mb-1">
                  {item.prompt.question}
                </p>
                <p className="text-sm">{item.prompt.answer}</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Social Links */}
      {hasSocials && (
        <div className="flex items-center justify-center gap-5 px-5 pb-5 pt-2 border-t border-border/50 mx-5">
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
          )}
          {twitterHandle && (
            <a
              href={`https://x.com/${twitterHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="h-5 w-5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
