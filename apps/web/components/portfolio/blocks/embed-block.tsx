"use client";

import { ExternalLink } from "lucide-react";

interface EmbedBlockProps {
  content: {
    url?: string;
    html?: string;
    caption?: string;
    aspectRatio?: "video" | "square" | "portrait";
  };
}

export function EmbedBlock({ content }: EmbedBlockProps) {
  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
  };

  const aspectClass = aspectClasses[content.aspectRatio || "video"];

  // If HTML embed code is provided, render it directly
  if (content.html) {
    return (
      <figure>
        <div
          className={`relative ${aspectClass} rounded-lg overflow-hidden bg-muted`}
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
        {content.caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {content.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // If URL is provided, use iframe
  if (content.url) {
    return (
      <figure>
        <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-muted`}>
          <iframe
            src={content.url}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {content.caption && (
          <figcaption className="mt-2 text-center text-sm text-muted-foreground">
            {content.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className="p-6 bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-2">
      <ExternalLink className="h-8 w-8" />
      <p>No embed URL or HTML provided</p>
    </div>
  );
}
