"use client";

interface VideoEmbedBlockProps {
  content: {
    url?: string;
    caption?: string;
  };
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

export function VideoEmbedBlock({ content }: VideoEmbedBlockProps) {
  if (!content.url) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No video URL provided
      </div>
    );
  }

  const embedUrl = getEmbedUrl(content.url);

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        Unsupported video platform. Please use YouTube or Vimeo.
      </div>
    );
  }

  return (
    <figure>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
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
