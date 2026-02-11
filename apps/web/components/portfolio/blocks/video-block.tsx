"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

interface VideoBlockProps {
  content: {
    url?: string;
    caption?: string;
    poster?: string;
  };
}

export function VideoBlock({ content }: VideoBlockProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPaused(false);
        } else {
          video.pause();
          setPaused(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, []);

  if (!content.url) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No video URL provided
      </div>
    );
  }

  return (
    <figure>
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden bg-black group cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={content.url}
          poster={content.poster}
          className="w-full"
          muted
          playsInline
          loop
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
        {/* Mute/Unmute toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        {/* Play indicator when paused */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-3 rounded-full bg-black/50">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
      {content.caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}
