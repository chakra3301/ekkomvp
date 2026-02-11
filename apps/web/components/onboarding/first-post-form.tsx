"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MediaUpload, isVideoUrl } from "@/components/ui/media-upload";
import { trpc } from "@/lib/trpc/client";

interface FirstPostFormProps {
  userId: string;
}

export function FirstPostForm({ userId }: FirstPostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      toast.success("Your first post is live!");
      router.push("/feed");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "Failed to create post");
    },
  });

  const handleSubmit = () => {
    if (!content.trim() && mediaUrls.length === 0) {
      toast.error("Write something or add media");
      return;
    }
    setIsSubmitting(true);
    createPost.mutate({
      content: content.trim() || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
    });
  };

  const handleSkip = () => {
    router.push("/feed");
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading">
          Create Your First Post
        </CardTitle>
        <CardDescription>
          Introduce yourself to the community. You can always skip this.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Hey EKKO! I'm a [your discipline] based in [location]. Excited to connect with fellow creatives..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          disabled={isSubmitting}
          className="resize-none"
        />

        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted"
              >
                {isVideoUrl(url) ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    setMediaUrls(mediaUrls.filter((_, i) => i !== index))
                  }
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload area */}
        {showUpload && mediaUrls.length < 4 && (
          <div className="mt-3 border rounded-lg p-3">
            <MediaUpload
              value={undefined}
              onChange={(url) => {
                setMediaUrls([...mediaUrls, url]);
                if (mediaUrls.length >= 3) setShowUpload(false);
              }}
              onRemove={() => {}}
              userId={userId}
              accept="image+video"
              bucket="posts"
              aspectRatio="video"
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isSubmitting || mediaUrls.length >= 4}
            onClick={() => setShowUpload(!showUpload)}
            className={showUpload ? "text-primary" : "text-muted-foreground"}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>
          {mediaUrls.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {mediaUrls.length}/4 media
            </span>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && mediaUrls.length === 0)}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            Post & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
