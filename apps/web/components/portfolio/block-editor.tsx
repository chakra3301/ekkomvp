"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { MediaUpload } from "@/components/ui/media-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BlockEditorProps {
  block: {
    id: string;
    type: string;
    content: Record<string, unknown>;
  };
  onSave: (content: Record<string, unknown>) => void;
  onClose: () => void;
  userId?: string;
}

export function BlockEditor({ block, onSave, onClose, userId }: BlockEditorProps) {
  const [content, setContent] = useState<Record<string, unknown>>(block.content);

  const updateField = (key: string, value: unknown) => {
    setContent({ ...content, [key]: value });
  };

  const handleSave = () => {
    onSave(content);
  };

  const renderEditor = () => {
    switch (block.type) {
      case "TEXT":
        return (
          <div className="space-y-4">
            <div>
              <Label>Heading (optional)</Label>
              <Input
                value={(content.heading as string) || ""}
                onChange={(e) => updateField("heading", e.target.value)}
                placeholder="Section heading"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Heading Level</Label>
              <Select
                value={(content.headingLevel as string) || "h3"}
                onValueChange={(value) => updateField("headingLevel", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                  <SelectItem value="h4">Heading 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Text *</Label>
              <Textarea
                value={(content.text as string) || ""}
                onChange={(e) => updateField("text", e.target.value)}
                placeholder="Your text content..."
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
        );

      case "IMAGE":
        return (
          <div className="space-y-4">
            <div>
              <Label>Image *</Label>
              {userId ? (
                <ImageUpload
                  value={(content.url as string) || undefined}
                  onChange={(url) => updateField("url", url)}
                  onRemove={() => updateField("url", "")}
                  userId={userId}
                  className="mt-1"
                  aspectRatio="auto"
                />
              ) : (
                <MediaUpload
                  value={(content.url as string) || undefined}
                  onChange={(url) => updateField("url", url)}
                  onRemove={() => updateField("url", "")}
                  userId=""
                  accept="image"
                  bucket="portfolio"
                  className="mt-1"
                  aspectRatio="auto"
                />
              )}
            </div>
            <div>
              <Label>Alt Text</Label>
              <Input
                value={(content.alt as string) || ""}
                onChange={(e) => updateField("alt", e.target.value)}
                placeholder="Describe the image"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(content.caption as string) || ""}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Image caption"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "IMAGE_GALLERY": {
        const images = (content.images as Array<{ url: string; alt?: string; caption?: string }>) || [];
        return (
          <div className="space-y-4">
            <div>
              <Label>Layout</Label>
              <Select
                value={(content.layout as string) || "grid"}
                onValueChange={(value) => updateField("layout", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Columns</Label>
              <Select
                value={String((content.columns as number) || 3)}
                onValueChange={(value) => updateField("columns", parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gallery Images</Label>
              <div className="mt-2 space-y-3">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {img.url ? (
                      <div className="relative w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <p className="flex-1 text-sm text-muted-foreground truncate">
                      {img.url ? img.url.split("/").pop()?.split("?")[0] : "No file"}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newImages = images.filter((_, i) => i !== index);
                        updateField("images", newImages);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {userId ? (
                  <ImageUpload
                    value={undefined}
                    onChange={(url) => {
                      updateField("images", [...images, { url, alt: "", caption: "" }]);
                    }}
                    userId={userId}
                    className="h-32"
                    aspectRatio="auto"
                  />
                ) : (
                  <MediaUpload
                    value={undefined}
                    onChange={(url) => {
                      updateField("images", [...images, { url, alt: "", caption: "" }]);
                    }}
                    onRemove={() => {}}
                    userId=""
                    accept="image"
                    bucket="portfolio"
                    className="h-32"
                    aspectRatio="auto"
                  />
                )}
              </div>
            </div>
          </div>
        );
      }

      case "VIDEO":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Video</Label>
              <MediaUpload
                value={(content.url as string) || undefined}
                onChange={(url) => updateField("url", url)}
                onRemove={() => updateField("url", "")}
                userId={userId || ""}
                accept="video"
                bucket="portfolio"
                className="mt-1"
                aspectRatio="auto"
              />
            </div>
            <div>
              <Label>Poster Image (optional)</Label>
              {userId ? (
                <ImageUpload
                  value={(content.poster as string) || undefined}
                  onChange={(url) => updateField("poster", url)}
                  onRemove={() => updateField("poster", "")}
                  userId={userId}
                  className="mt-1 h-32"
                  aspectRatio="auto"
                />
              ) : (
                <MediaUpload
                  value={(content.poster as string) || undefined}
                  onChange={(url) => updateField("poster", url)}
                  onRemove={() => updateField("poster", "")}
                  userId=""
                  accept="image"
                  bucket="portfolio"
                  className="mt-1 h-32"
                  aspectRatio="auto"
                />
              )}
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(content.caption as string) || ""}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Video caption"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "VIDEO_EMBED":
        return (
          <div className="space-y-4">
            <div>
              <Label>YouTube or Vimeo URL *</Label>
              <Input
                value={(content.url as string) || ""}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports YouTube and Vimeo links
              </p>
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(content.caption as string) || ""}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Video caption"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "AUDIO":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload Audio</Label>
              <MediaUpload
                value={(content.url as string) || undefined}
                onChange={(url) => updateField("url", url)}
                onRemove={() => updateField("url", "")}
                userId={userId || ""}
                accept="audio"
                bucket="portfolio"
                className="mt-1"
                aspectRatio="auto"
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={(content.title as string) || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Track title"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Artist</Label>
              <Input
                value={(content.artist as string) || ""}
                onChange={(e) => updateField("artist", e.target.value)}
                placeholder="Artist name"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cover Image (optional)</Label>
              {userId ? (
                <ImageUpload
                  value={(content.coverUrl as string) || undefined}
                  onChange={(url) => updateField("coverUrl", url)}
                  onRemove={() => updateField("coverUrl", "")}
                  userId={userId}
                  className="mt-1 h-32"
                  aspectRatio="auto"
                />
              ) : (
                <MediaUpload
                  value={(content.coverUrl as string) || undefined}
                  onChange={(url) => updateField("coverUrl", url)}
                  onRemove={() => updateField("coverUrl", "")}
                  userId=""
                  accept="image"
                  bucket="portfolio"
                  className="mt-1 h-32"
                  aspectRatio="auto"
                />
              )}
            </div>
          </div>
        );

      case "MODEL_3D":
        return (
          <div className="space-y-4">
            <div>
              <Label>Upload 3D Model</Label>
              <MediaUpload
                value={(content.url as string) || undefined}
                onChange={(url) => updateField("url", url)}
                onRemove={() => updateField("url", "")}
                userId={userId || ""}
                accept="model"
                bucket="portfolio"
                className="mt-1"
                aspectRatio="auto"
              />
              <p className="text-xs text-muted-foreground mt-1">
                GLB, GLTF, OBJ, FBX, USDZ up to 50MB
              </p>
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(content.caption as string) || ""}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Model description"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "EMBED":
        return (
          <div className="space-y-4">
            <div>
              <Label>Embed URL</Label>
              <Input
                value={(content.url as string) || ""}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Or paste HTML embed code</Label>
              <Textarea
                value={(content.html as string) || ""}
                onChange={(e) => updateField("html", e.target.value)}
                placeholder="<iframe src=..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Aspect Ratio</Label>
              <Select
                value={(content.aspectRatio as string) || "video"}
                onValueChange={(value) => updateField("aspectRatio", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">16:9 (Video)</SelectItem>
                  <SelectItem value="square">1:1 (Square)</SelectItem>
                  <SelectItem value="portrait">3:4 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Caption (optional)</Label>
              <Input
                value={(content.caption as string) || ""}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Embed caption"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "DIVIDER":
        return (
          <div className="text-center py-8 text-muted-foreground">
            This block adds a horizontal divider line.
            <br />
            No configuration needed.
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Unknown block type: {block.type}
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {block.type.replace("_", " ")} Block</DialogTitle>
        </DialogHeader>
        <div className="py-4">{renderEditor()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Block</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
