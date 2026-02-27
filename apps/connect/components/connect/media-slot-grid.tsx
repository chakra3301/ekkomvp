"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Plus, X, Loader2, Video, Music } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  uploadConnectMedia,
  uploadConnectAudio,
  uploadConnectModel,
  isVideoUrl,
  isAudioUrl,
  isModelUrl,
  isModelFile,
} from "@/lib/supabase/storage";
import { ModelViewerSlot } from "./model-viewer-slot";
import { CONNECT_LIMITS } from "@ekko/config";

export interface MediaSlot {
  url: string;
  mediaType: "PHOTO" | "VIDEO" | "AUDIO" | "MODEL";
  sortOrder: number;
}

interface MediaSlotGridProps {
  slots: MediaSlot[];
  onChange: (slots: MediaSlot[]) => void;
  userId: string;
  maxSlots?: number;
}

function getMaxSize(file: File): number {
  if (file.type.startsWith("video/")) return CONNECT_LIMITS.MAX_FILE_SIZE_CONNECT_VIDEO;
  if (file.type.startsWith("audio/")) return CONNECT_LIMITS.MAX_FILE_SIZE_CONNECT_AUDIO;
  if (isModelFile(file)) return CONNECT_LIMITS.MAX_FILE_SIZE_CONNECT_MODEL;
  return CONNECT_LIMITS.MAX_FILE_SIZE_CONNECT;
}

function formatSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function MediaSlotGrid({ slots, onChange, userId, maxSlots = 6 }: MediaSlotGridProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleUpload = useCallback(
    async (index: number, file: File) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");
      const isModel = isModelFile(file);

      if (!isImage && !isVideo && !isAudio && !isModel) {
        alert("Please upload an image, video, audio, or 3D model file");
        return;
      }

      const maxSize = getMaxSize(file);
      if (file.size > maxSize) {
        alert(`File must be under ${formatSize(maxSize)}`);
        return;
      }

      setUploadingIndex(index);
      try {
        let url: string;
        let mediaType: MediaSlot["mediaType"];

        if (isAudio) {
          url = await uploadConnectAudio(userId, file);
          mediaType = "AUDIO";
        } else if (isModel) {
          url = await uploadConnectModel(userId, file);
          mediaType = "MODEL";
        } else {
          url = await uploadConnectMedia(userId, file);
          mediaType = isVideo ? "VIDEO" : "PHOTO";
        }

        const newSlots = [...slots];
        const slot: MediaSlot = { url, mediaType, sortOrder: index };

        const existingIdx = newSlots.findIndex((s) => s.sortOrder === index);
        if (existingIdx >= 0) {
          newSlots[existingIdx] = slot;
        } else {
          newSlots.push(slot);
        }

        onChange(newSlots.sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (error) {
        console.error("Upload error:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setUploadingIndex(null);
      }
    },
    [slots, onChange, userId]
  );

  const handleRemove = (index: number) => {
    const newSlots = slots.filter((s) => s.sortOrder !== index);
    onChange(newSlots);
  };

  const renderSlot = (index: number) => {
    const slot = slots.find((s) => s.sortOrder === index);
    const isUploading = uploadingIndex === index;
    const isFeatured = index === 0;

    return (
      <div
        key={index}
        className={cn(
          "relative rounded-2xl overflow-hidden border-2 border-dashed transition-colors",
          isFeatured ? "col-span-2 row-span-2" : "",
          slot
            ? "border-transparent"
            : "border-muted-foreground/25 hover:border-primary/50 bg-muted/50"
        )}
      >
        {slot ? (
          <>
            {slot.mediaType === "AUDIO" || isAudioUrl(slot.url) ? (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex flex-col items-center justify-center gap-2">
                <Music className="h-8 w-8 text-primary" />
                <audio src={slot.url} controls className="w-[85%] h-8" />
                <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1">
                  <Music className="h-3 w-3 text-white" />
                </div>
              </div>
            ) : slot.mediaType === "MODEL" || isModelUrl(slot.url) ? (
              <ModelViewerSlot src={slot.url} />
            ) : slot.mediaType === "VIDEO" || isVideoUrl(slot.url) ? (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <video
                  src={slot.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute bottom-2 left-2 bg-black/60 rounded-full p-1">
                  <Video className="h-3 w-3 text-white" />
                </div>
              </div>
            ) : (
              <Image
                src={slot.url}
                alt={`Media ${index + 1}`}
                fill
                className="object-cover"
              />
            )}
            <button
              onClick={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
            <input
              type="file"
              accept="image/*,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,audio/aac,.mp3,.glb,.gltf,.obj,.fbx,.usdz"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleUpload(index, e.target.files[0]);
              }}
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Plus className="h-6 w-6 text-muted-foreground" />
                {isFeatured && (
                  <span className="text-xs text-muted-foreground mt-1">
                    Featured
                  </span>
                )}
              </>
            )}
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-2 aspect-[3/4]">
      {Array.from({ length: maxSlots }, (_, i) => renderSlot(i))}
    </div>
  );
}
