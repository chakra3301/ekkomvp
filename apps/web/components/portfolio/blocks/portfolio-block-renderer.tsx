"use client";

import { TextBlock } from "./text-block";
import { ImageBlock } from "./image-block";
import { ImageGalleryBlock } from "./image-gallery-block";
import { VideoBlock } from "./video-block";
import { VideoEmbedBlock } from "./video-embed-block";
import { AudioBlock } from "./audio-block";
import { Model3DBlock } from "./model-3d-block";
import { EmbedBlock } from "./embed-block";
import { DividerBlock } from "./divider-block";

interface PortfolioBlockRendererProps {
  block: {
    id: string;
    type: string;
    content: unknown;
    sortOrder: number;
  };
}

export function PortfolioBlockRenderer({ block }: PortfolioBlockRendererProps) {
  const content = block.content as Record<string, unknown>;

  switch (block.type) {
    case "TEXT":
      return <TextBlock content={content} />;
    case "IMAGE":
      return <ImageBlock content={content} />;
    case "IMAGE_GALLERY":
      return <ImageGalleryBlock content={content} />;
    case "VIDEO":
      return <VideoBlock content={content} />;
    case "VIDEO_EMBED":
      return <VideoEmbedBlock content={content} />;
    case "AUDIO":
      return <AudioBlock content={content} />;
    case "MODEL_3D":
      return <Model3DBlock content={content} />;
    case "EMBED":
      return <EmbedBlock content={content} />;
    case "DIVIDER":
      return <DividerBlock />;
    default:
      return (
        <div className="p-4 bg-muted rounded-lg text-muted-foreground text-sm">
          Unknown block type: {block.type}
        </div>
      );
  }
}
