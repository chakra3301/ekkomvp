"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon, Video, Music, Box } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@ekko/config";
import {
  uploadPortfolioImage,
  uploadPortfolioVideo,
  uploadPortfolioAudio,
  uploadPortfolioModel,
  uploadPostImage,
  uploadPostVideo,
  uploadPostAudio,
} from "@/lib/supabase/storage";

type MediaAccept = "image" | "video" | "audio" | "image+video" | "model";

interface MediaUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  userId: string;
  accept: MediaAccept;
  bucket: "portfolio" | "posts";
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
}

const ACCEPT_MAP: Record<MediaAccept, string> = {
  image: "image/png,image/jpeg,image/jpg,image/gif,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/mp3",
  "image+video":
    "image/png,image/jpeg,image/jpg,image/gif,image/webp,video/mp4,video/webm,video/quicktime",
  model: ".glb,.gltf,.obj,.fbx,.usdz",
};

const LABELS: Record<MediaAccept, { idle: string; drop: string; hint: string }> = {
  image: {
    idle: "Click or drag to upload image",
    drop: "Drop image here",
    hint: "PNG, JPG, GIF up to 10MB",
  },
  video: {
    idle: "Click or drag to upload video",
    drop: "Drop video here",
    hint: "MP4, WebM up to 50MB",
  },
  audio: {
    idle: "Click or drag to upload audio",
    drop: "Drop audio here",
    hint: "MP3, WAV, OGG up to 20MB",
  },
  "image+video": {
    idle: "Click or drag to upload",
    drop: "Drop file here",
    hint: "Images up to 10MB, videos up to 50MB",
  },
  model: {
    idle: "Click or drag to upload 3D model",
    drop: "Drop 3D model here",
    hint: "GLB, GLTF, OBJ, FBX, USDZ up to 50MB",
  },
};

const MODEL_EXTENSIONS = [".glb", ".gltf", ".obj", ".fbx", ".usdz"];

function isModelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return MODEL_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function getMaxSize(file: File): number {
  if (file.type.startsWith("video/")) return LIMITS.MAX_FILE_SIZE_VIDEO;
  if (file.type.startsWith("audio/")) return LIMITS.MAX_FILE_SIZE_AUDIO;
  if (isModelFile(file)) return LIMITS.MAX_FILE_SIZE_MODEL;
  return LIMITS.MAX_FILE_SIZE_POST;
}

function getUploadFn(
  file: File,
  bucket: "portfolio" | "posts"
): (userId: string, file: File) => Promise<string> {
  if (file.type.startsWith("video/")) {
    return bucket === "portfolio" ? uploadPortfolioVideo : uploadPostVideo;
  }
  if (file.type.startsWith("audio/")) {
    return bucket === "portfolio" ? uploadPortfolioAudio : uploadPostAudio;
  }
  if (isModelFile(file)) {
    return uploadPortfolioModel;
  }
  return bucket === "portfolio" ? uploadPortfolioImage : uploadPostImage;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes("/video-");
}

function isAudioUrl(url: string): boolean {
  return /\.(mp3|wav|ogg|aac)(\?|$)/i.test(url) || url.includes("/audio-");
}

function isModelUrl(url: string): boolean {
  return /\.(glb|gltf|obj|fbx|usdz)(\?|$)/i.test(url) || url.includes("/model-");
}

const ICON_MAP: Record<MediaAccept, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  "image+video": ImageIcon,
  model: Box,
};

export function MediaUpload({
  value,
  onChange,
  onRemove,
  userId,
  accept,
  bucket,
  className,
  aspectRatio = "video",
}: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "min-h-[200px]",
  };

  const handleFile = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");

      if (accept === "image" && !isImage) {
        alert("Please upload an image file");
        return;
      }
      if (accept === "video" && !isVideo) {
        alert("Please upload a video file");
        return;
      }
      if (accept === "audio" && !isAudio) {
        alert("Please upload an audio file");
        return;
      }
      if (accept === "image+video" && !isImage && !isVideo) {
        alert("Please upload an image or video file");
        return;
      }
      if (accept === "model" && !isModelFile(file)) {
        alert("Please upload a 3D model file (GLB, GLTF, OBJ, FBX, USDZ)");
        return;
      }

      const maxSize = getMaxSize(file);
      if (file.size > maxSize) {
        const sizeMB = Math.round(maxSize / (1024 * 1024));
        alert(`File size must be less than ${sizeMB}MB`);
        return;
      }

      setIsUploading(true);
      try {
        const uploadFn = getUploadFn(file, bucket);
        const url = await uploadFn(userId, file);
        onChange(url);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onChange, accept, bucket]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  // Preview for existing value
  if (value) {
    if (isVideoUrl(value)) {
      return (
        <div className={cn("relative rounded-lg overflow-hidden bg-muted", aspectClasses[aspectRatio], className)}>
          <video src={value} controls className="w-full h-full object-contain bg-black" />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-lg"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    if (isAudioUrl(value)) {
      return (
        <div className={cn("relative rounded-lg overflow-hidden bg-muted p-4", className)}>
          <audio src={value} controls className="w-full" />
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-lg"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    if (isModelUrl(value)) {
      const fileName = value.split("/").pop()?.split("?")[0] || "3D Model";
      return (
        <div className={cn("relative rounded-lg overflow-hidden bg-muted flex flex-col items-center justify-center gap-2 p-4", aspectClasses[aspectRatio], className)}>
          <Box className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium truncate max-w-full">{fileName}</p>
          <p className="text-xs text-muted-foreground">3D model uploaded</p>
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-lg"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }

    // Default: image preview
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-muted", aspectClasses[aspectRatio], className)}>
        <Image src={value} alt="Uploaded media" fill className="object-cover" />
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-lg"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  const Icon = ICON_MAP[accept];
  const labels = LABELS[accept];

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed transition-colors",
        dragActive
          ? "border-accent bg-accent/10"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        aspectClasses[aspectRatio],
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={ACCEPT_MAP[accept]}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="p-3 rounded-lg bg-muted">
              {dragActive ? (
                <Upload className="h-6 w-6 text-accent" />
              ) : (
                <Icon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="mt-3 text-sm font-medium">
              {dragActive ? labels.drop : labels.idle}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{labels.hint}</p>
          </>
        )}
      </div>
    </div>
  );
}

export { isVideoUrl, isAudioUrl, isModelUrl };
