"use client";

import { Instagram } from "lucide-react";

interface InstagramPreviewProps {
  handle: string;
}

export function InstagramPreview({ handle }: InstagramPreviewProps) {
  return (
    <a
      href={`https://instagram.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 glass-card p-4 rounded-xl hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shrink-0">
        <Instagram className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">@{handle}</p>
        <p className="text-xs text-muted-foreground">View on Instagram</p>
      </div>
      <svg
        className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}
