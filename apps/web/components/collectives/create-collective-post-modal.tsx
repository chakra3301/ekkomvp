"use client";

import { useState } from "react";
import {
  Loader2,
  ImagePlus,
  X,
  Type,
  Video,
  Music,
  Box,
  Code,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MediaUpload, isVideoUrl } from "@/components/ui/media-upload";
import { BlockEditor } from "@/components/portfolio/block-editor";
import { PortfolioBlockRenderer } from "@/components/portfolio/blocks/portfolio-block-renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks/use-user";

const INLINE_MEDIA_TYPES = ["IMAGE", "VIDEO", "AUDIO", "MODEL_3D"];

const BLOCK_TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  IMAGE: "Image",
  IMAGE_GALLERY: "Gallery",
  VIDEO: "Video",
  VIDEO_EMBED: "Video Embed",
  AUDIO: "Audio",
  MODEL_3D: "3D Model",
  EMBED: "Embed",
};

interface PostBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sortOrder: number;
}

interface CreateCollectivePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectiveId: string;
  collectiveSlug: string;
}

export function CreateCollectivePostModal({
  open,
  onOpenChange,
  collectiveId,
  collectiveSlug,
}: CreateCollectivePostModalProps) {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"COLLECTIVE_ONLY" | "BOTH">("COLLECTIVE_ONLY");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<PostBlock[]>([]);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PostBlock | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = trpc.useUtils();

  const createMutation = trpc.collective.createCollectivePost.useMutation({
    onSuccess: () => {
      toast.success("Post created!");
      utils.collective.getCollectivePosts.invalidate();
      utils.collective.getBySlug.invalidate(collectiveSlug);
      if (visibility === "BOTH") {
        utils.feed.getChronological.invalidate();
      }
      resetForm();
      setIsSubmitting(false);
      onOpenChange(false);
    },
    onError: (err) => {
      setIsSubmitting(false);
      toast.error(err.message);
    },
  });

  const resetForm = () => {
    setContent("");
    setVisibility("COLLECTIVE_ONLY");
    setMediaUrls([]);
    setBlocks([]);
    setShowMediaUpload(false);
    setEditingBlock(null);
  };

  const handleSubmit = () => {
    const hasContent = content.trim().length > 0;
    const hasMedia = mediaUrls.length > 0;
    const hasBlocks = blocks.length > 0;
    if (!hasContent && !hasMedia && !hasBlocks) {
      toast.error("Please add some content or media");
      return;
    }

    setIsSubmitting(true);
    createMutation.mutate({
      collectiveId,
      content: content.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      visibility,
      blocks:
        blocks.length > 0
          ? blocks.map((b, i) => ({ type: b.type as "IMAGE" | "VIDEO" | "AUDIO" | "TEXT" | "IMAGE_GALLERY" | "VIDEO_EMBED" | "MODEL_3D" | "EMBED", content: b.content, sortOrder: i }))
          : undefined,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      resetForm();
    }
    onOpenChange(open);
  };

  const addMedia = (url: string) => {
    if (mediaUrls.length < 4) {
      setMediaUrls([...mediaUrls, url]);
    }
  };

  const removeMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const addBlock = (type: string) => {
    const newBlock: PostBlock = {
      id: `new-${Date.now()}`,
      type,
      content: {},
      sortOrder: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
    if (!INLINE_MEDIA_TYPES.includes(type)) {
      setEditingBlock(newBlock);
    }
  };

  const getMediaAccept = (type: string): "image" | "video" | "audio" | "model" => {
    switch (type) {
      case "VIDEO": return "video";
      case "AUDIO": return "audio";
      case "MODEL_3D": return "model";
      default: return "image";
    }
  };

  const updateBlock = (id: string, newContent: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b)));
    setEditingBlock(null);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (editingBlock?.id === id) setEditingBlock(null);
  };

  const canSubmit =
    content.trim().length > 0 || mediaUrls.length > 0 || blocks.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share something with this collective.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Text Content */}
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/500
            </p>
          </div>

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                >
                  {isVideoUrl(url) ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Block previews — inline WYSIWYG */}
          {blocks.length > 0 && (
            <div className="space-y-3">
              {blocks.map((block) => {
                const url = block.content.url as string | undefined;
                const isInlineMedia = INLINE_MEDIA_TYPES.includes(block.type);
                const hasBlockContent = Object.keys(block.content).some(
                  (k) => block.content[k] !== undefined && block.content[k] !== "" && block.content[k] !== null
                );

                if (isInlineMedia && !url) {
                  return (
                    <div key={block.id} className="relative">
                      <MediaUpload
                        value={undefined}
                        onChange={(uploadedUrl) => {
                          updateBlock(block.id, { ...block.content, url: uploadedUrl });
                        }}
                        onRemove={() => {}}
                        userId={user?.id || ""}
                        accept={getMediaAccept(block.type)}
                        bucket="posts"
                        aspectRatio="video"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-destructive hover:text-destructive-foreground z-10"
                        onClick={() => removeBlock(block.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                }

                if (hasBlockContent) {
                  return (
                    <div key={block.id} className="relative group rounded-lg overflow-hidden">
                      <PortfolioBlockRenderer
                        block={{
                          id: block.id,
                          type: block.type,
                          content: block.content,
                          sortOrder: block.sortOrder,
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-destructive z-10"
                        onClick={() => removeBlock(block.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                }

                return (
                  <div
                    key={block.id}
                    className="flex items-center justify-between gap-2 py-3 px-4 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setEditingBlock(block)}
                  >
                    <span className="text-sm text-muted-foreground">
                      {BLOCK_TYPE_LABELS[block.type] || block.type} — tap to add content
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(block.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick image/video upload area */}
          {showMediaUpload && user?.id && mediaUrls.length < 4 && (
            <div className="border rounded-lg p-3">
              <MediaUpload
                value={undefined}
                onChange={(url) => {
                  addMedia(url);
                  if (mediaUrls.length >= 3) {
                    setShowMediaUpload(false);
                  }
                }}
                onRemove={() => {}}
                userId={user.id}
                accept="image+video"
                bucket="posts"
                aspectRatio="video"
              />
            </div>
          )}

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as "COLLECTIVE_ONLY" | "BOTH")}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLLECTIVE_ONLY">Collective Only</SelectItem>
                <SelectItem value="BOTH">Collective + Your Feed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {visibility === "COLLECTIVE_ONLY"
                ? "Only visible within this collective"
                : "Visible in the collective and on your public feed"}
            </p>
          </div>
        </div>

        {/* Icon toolbar */}
        <DialogFooter className="px-6 py-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting || mediaUrls.length >= 4}
                onClick={() => setShowMediaUpload(!showMediaUpload)}
                className={showMediaUpload ? "text-primary" : "text-muted-foreground hover:text-primary"}
                title="Photo / Video"
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => addBlock("VIDEO")}
                className="text-muted-foreground hover:text-primary"
                title="Video"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => addBlock("AUDIO")}
                className="text-muted-foreground hover:text-primary"
                title="Audio"
              >
                <Music className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => addBlock("TEXT")}
                className="text-muted-foreground hover:text-primary"
                title="Text Block"
              >
                <Type className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => addBlock("MODEL_3D")}
                className="text-muted-foreground hover:text-primary"
                title="3D Model"
              >
                <Box className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isSubmitting}
                onClick={() => addBlock("EMBED")}
                className="text-muted-foreground hover:text-primary"
                title="Embed"
              >
                <Code className="h-5 w-5" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
              className="rounded-full px-6"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Block editor dialog (for text, embed blocks) */}
      {editingBlock && (
        <BlockEditor
          block={{
            id: editingBlock.id,
            type: editingBlock.type,
            content: editingBlock.content,
          }}
          onSave={(newContent) => updateBlock(editingBlock.id, newContent)}
          onClose={() => setEditingBlock(null)}
          userId={user?.id}
        />
      )}
    </Dialog>
  );
}
