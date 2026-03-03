"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InstagramPreviewProps {
  handle: string;
}

interface IgData {
  profilePicUrl: string | null;
  posts: { imageUrl: string }[];
}

function IgIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InstagramPreview({ handle }: InstagramPreviewProps) {
  const profileUrl = `https://instagram.com/${handle}`;
  const [igData, setIgData] = useState<IgData | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/instagram/${encodeURIComponent(handle)}`)
      .then((res) => res.json())
      .then((data: IgData) => {
        if (!cancelled) setIgData(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const postImages = igData?.posts?.map((p) => p.imageUrl) || [];

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block glass-card rounded-xl overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all group"
    >
      {/* Profile header */}
      <div className="flex items-center gap-3 p-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px] shrink-0">
          <div className="h-full w-full rounded-full bg-card overflow-hidden">
            {igData?.profilePicUrl ? (
              <img
                src={igData.profilePicUrl}
                alt={handle}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full flex items-center justify-center">
                <IgIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{handle}</p>
          <p className="text-[11px] text-muted-foreground">Instagram</p>
        </div>
        <div className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          View
        </div>
      </div>

      {/* Post grid */}
      <div className="grid grid-cols-3 gap-[2px] px-3 pb-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="relative aspect-square rounded overflow-hidden bg-muted/60"
          >
            {postImages[i] && !failedImages.has(i) ? (
              <img
                src={postImages[i]}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={() => handleImageError(i)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <IgIcon className="h-4 w-4 text-muted-foreground/30" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-3 py-2 flex items-center justify-center gap-1.5">
        <IgIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground">
          View @{handle} on Instagram
        </span>
      </div>
    </a>
  );
}
