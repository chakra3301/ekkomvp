"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ImageGalleryBlockProps {
  content: {
    images?: Array<{
      url: string;
      alt?: string;
      caption?: string;
    }>;
    layout?: "grid" | "carousel" | "masonry";
    columns?: 2 | 3 | 4;
  };
}

export function ImageGalleryBlock({ content }: ImageGalleryBlockProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = content.images || [];
  const _layout = content.layout || "grid";
  const columns = content.columns || 3;

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No images in gallery
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <>
      <div className={cn("grid gap-3", gridCols[columns])}>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setLightboxIndex(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            <Image
              src={image.url}
              alt={image.alt || `Gallery image ${index + 1}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {lightboxIndex < images.length - 1 && (
            <button
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="relative max-w-5xl max-h-[80vh] w-full h-full mx-4">
            <Image
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt || `Gallery image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {images[lightboxIndex].caption && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
              {images[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </>
  );
}
