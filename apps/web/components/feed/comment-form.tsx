"use client";

import { useState, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { LIMITS } from "@ekko/config";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const { profile } = useProfile();
  const { promptLogin } = useLoginPrompt();
  const utils = trpc.useUtils();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addComment = trpc.post.addComment.useMutation({
    onSuccess: () => {
      setContent("");
      utils.post.getComments.invalidate({ postId });
      onCommentAdded?.();
      textareaRef.current?.focus();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!profile) {
      promptLogin("Sign in to comment on posts.");
      return;
    }
    addComment.mutate({ postId, content: trimmed });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!profile) {
    return (
      <button
        type="button"
        onClick={() => promptLogin("Sign in to comment on posts.")}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
      >
        Sign in to leave a comment
      </button>
    );
  }

  const charCount = content.length;
  const maxLength = LIMITS.COMMENT_MAX_LENGTH;
  const isOverLimit = charCount > maxLength;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 items-start">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={profile.avatarUrl || undefined} />
        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
          {getInitials(profile.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a comment..."
          rows={1}
          className="min-h-[36px] resize-none text-sm py-2"
          disabled={addComment.isPending}
        />
        <div className="flex items-center justify-between mt-1">
          <span
            className={`text-xs ${isOverLimit ? "text-destructive" : "text-muted-foreground"}`}
          >
            {charCount}/{maxLength}
          </span>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isOverLimit || addComment.isPending}
            className="h-7 px-2.5 text-xs"
          >
            {addComment.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
