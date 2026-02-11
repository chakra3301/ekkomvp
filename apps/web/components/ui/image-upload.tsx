"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadPortfolioImage } from "@/lib/supabase/storage";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  userId: string;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  userId,
  className,
  aspectRatio = "video",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "min-h-[200px]",
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, etc.)");
        return;
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setIsUploading(true);
      try {
        const url = await uploadPortfolioImage(userId, file);
        onChange(url);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload image. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onChange]
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

  if (value) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden bg-muted", aspectClasses[aspectRatio], className)}>
        <Image
          src={value}
          alt="Uploaded image"
          fill
          className="object-cover"
        />
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

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed transition-colors",
        dragActive ? "border-accent bg-accent/10" : "border-muted-foreground/25 hover:border-muted-foreground/50",
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
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
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
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <p className="mt-3 text-sm font-medium">
              {dragActive ? "Drop image here" : "Click or drag to upload"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, GIF up to 10MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
