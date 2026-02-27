"use client";

import Image from "next/image";
import { MapPin, Video, Music, Globe, Infinity } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { isVideoUrl, isAudioUrl, isModelUrl } from "@/lib/supabase/storage";
import { ModelViewerSlot } from "./model-viewer-slot";
import { InstagramPreview } from "./instagram-preview";
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

function renderMediaSlot(slot: MediaSlot, isFeatured?: boolean) {
  if (slot.mediaType === "AUDIO" || isAudioUrl(slot.url)) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex flex-col items-center justify-center gap-2">
        <Music className={cn("text-primary", isFeatured ? "h-12 w-12" : "h-8 w-8")} />
        <audio src={slot.url} controls className="w-[85%] h-8" />
      </div>
    );
  }

  if (slot.mediaType === "MODEL" || isModelUrl(slot.url)) {
    return <ModelViewerSlot src={slot.url} isFeatured={isFeatured} />;
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
        />
        <div className="absolute bottom-1 left-1 bg-black/60 rounded-full p-0.5">
          <Video className="h-3 w-3 text-white" />
        </div>
      </>
    );
  }

  return (
    <Image
      src={slot.url}
      alt="Media"
      fill
      sizes={isFeatured ? "(max-width: 512px) 100vw, 512px" : "(max-width: 512px) 50vw, 256px"}
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
  const hasSocials = instagramHandle || twitterHandle || websiteUrl;

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
          {renderMediaSlot(featuredSlot, true)}

          {/* Bottom gradient overlay (only for visual media) */}
          {(featuredSlot.mediaType === "PHOTO" || featuredSlot.mediaType === "VIDEO") && (
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
          )}

          {/* Name + location at bottom */}
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

      {/* Card body */}
      <div className="p-5 space-y-5">
        {/* Bio */}
        {bio && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              About
            </p>
            <p className="text-sm whitespace-pre-line">{bio}</p>
          </div>
        )}

        {/* Looking for */}
        {lookingFor && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Looking for
            </p>
            <p className="text-sm">{lookingFor}</p>
          </div>
        )}

        {/* Disciplines */}
        {disciplines && disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {disciplines.map((d) => (
              <Badge key={d.name} variant="glass" className="text-xs">
                {d.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Additional media */}
        {mediaSlots.filter((s) => s.sortOrder > 0).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaSlots
              .filter((s) => s.sortOrder > 0)
              .map((slot) => (
                <div
                  key={slot.sortOrder}
                  className="relative aspect-square rounded-xl overflow-hidden"
                >
                  {renderMediaSlot(slot)}
                </div>
              ))}
          </div>
        )}

        {/* Prompts */}
        {prompts
          .filter((p) => p.answer)
          .map((prompt, i) => (
            <div key={i} className="glass-card p-4 rounded-xl">
              <p className="text-xs font-medium text-primary mb-1">
                {prompt.question}
              </p>
              <p className="text-sm">{prompt.answer}</p>
            </div>
          ))}

        {/* Instagram Preview */}
        {instagramHandle && <InstagramPreview handle={instagramHandle} />}

        {/* Social Links */}
        {hasSocials && (
          <div className="flex items-center justify-center gap-5 pt-3 border-t border-border/50">
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
    </div>
  );
}
