"use client";

import Image from "next/image";

interface ImageBlockProps {
  content: {
    url?: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  };
}

export function ImageBlock({ content }: ImageBlockProps) {
  if (!content.url) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No image URL provided
      </div>
    );
  }

  return (
    <figure>
      <div className="relative rounded-lg overflow-hidden bg-muted">
        <Image
          src={content.url}
          alt={content.alt || "Portfolio image"}
          width={content.width || 1200}
          height={content.height || 800}
          className="w-full h-auto"
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
