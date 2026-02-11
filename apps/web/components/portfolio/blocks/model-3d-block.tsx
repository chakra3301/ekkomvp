"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Download } from "lucide-react";

interface Model3DBlockProps {
  content: {
    url?: string;
    caption?: string;
    poster?: string;
  };
}

const MODEL_VIEWER_EXTENSIONS = /\.(glb|gltf)(\?|$)/i;

function useModelViewer() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (customElements.get("model-viewer")) {
      setLoaded(true);
      return;
    }

    const existing = document.querySelector(
      'script[src*="model-viewer"]'
    );
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  return loaded;
}

export function Model3DBlock({ content }: Model3DBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelViewerLoaded = useModelViewer();

  if (!content.url) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Box className="h-12 w-12" />
        <p>No 3D model URL provided</p>
      </div>
    );
  }

  // Check if it's a Sketchfab embed
  const sketchfabMatch = content.url.match(
    /sketchfab\.com\/models\/([a-zA-Z0-9]+)/
  );

  if (sketchfabMatch) {
    return (
      <figure>
        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
          <iframe
            title="Sketchfab 3D Model"
            src={`https://sketchfab.com/models/${sketchfabMatch[1]}/embed`}
            allow="autoplay; fullscreen; xr-spatial-tracking"
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

  // For GLB/GLTF files, use model-viewer web component
  const isDirectModel =
    MODEL_VIEWER_EXTENSIONS.test(content.url) ||
    content.url.includes("/model-");

  if (isDirectModel) {
    return (
      <figure>
        <div
          ref={containerRef}
          className="relative aspect-video rounded-lg overflow-hidden bg-muted"
        >
          {modelViewerLoaded ? (
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{
                __html: `<model-viewer
                  src="${content.url}"
                  ${content.poster ? `poster="${content.poster}"` : ""}
                  alt="3D model"
                  camera-controls
                  touch-action="pan-y"
                  auto-rotate
                  shadow-intensity="1"
                  style="width:100%;height:100%;"
                ></model-viewer>`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Box className="h-12 w-12 animate-pulse" />
              <p className="text-sm">Loading 3D viewer...</p>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {content.caption && (
            <p className="text-sm text-muted-foreground">{content.caption}</p>
          )}
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      </figure>
    );
  }

  // Fallback for other URLs (unknown model hosting)
  return (
    <figure>
      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Box className="h-12 w-12" />
        <p className="text-sm">3D model</p>
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline text-sm"
        >
          Download model
        </a>
      </div>
      {content.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}
