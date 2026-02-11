"use client";

import Image from "next/image";
import { Music } from "lucide-react";

interface AudioBlockProps {
  content: {
    url?: string;
    title?: string;
    artist?: string;
    coverUrl?: string;
  };
}

export function AudioBlock({ content }: AudioBlockProps) {
  if (!content.url) {
    return (
      <div className="p-6 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No audio URL provided
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-4">
        {/* Cover or icon */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
          {content.coverUrl ? (
            <Image
              src={content.coverUrl}
              alt={content.title || "Audio cover"}
              fill
              className="object-cover"
            />
          ) : (
            <Music className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Info and player */}
        <div className="flex-1 min-w-0">
          {content.title && (
            <p className="font-medium truncate">{content.title}</p>
          )}
          {content.artist && (
            <p className="text-sm text-muted-foreground truncate">{content.artist}</p>
          )}
          <audio
            src={content.url}
            controls
            className="w-full mt-2 h-8"
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  );
}
