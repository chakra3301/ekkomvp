"use client";

import { useEffect, useRef } from "react";
import { Box } from "lucide-react";

import { cn } from "@/lib/utils";

interface ModelViewerSlotProps {
  src: string;
  className?: string;
  isFeatured?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | string;
          "camera-controls"?: boolean | string;
          "shadow-intensity"?: string;
          "touch-action"?: string;
          poster?: string;
          loading?: string;
          ar?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}

export function ModelViewerSlot({
  src,
  className,
  isFeatured,
}: ModelViewerSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Only .glb and .gltf are supported by model-viewer
  const isSupported = /\.(glb|gltf)(\?|$)/i.test(src);

  useEffect(() => {
    // Dynamically load model-viewer script if not already loaded
    if (isSupported && !customElements.get("model-viewer")) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex flex-col items-center justify-center gap-2",
          className
        )}
      >
        <Box
          className={cn(
            "text-primary",
            isFeatured ? "h-12 w-12" : "h-8 w-8"
          )}
        />
        <span className="text-xs text-muted-foreground">3D Model</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("absolute inset-0", className)}>
      <model-viewer
        src={src}
        alt="3D model"
        auto-rotate=""
        camera-controls=""
        shadow-intensity="1"
        touch-action="pan-y"
        loading="lazy"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
