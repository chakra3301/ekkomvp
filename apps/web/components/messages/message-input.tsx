"use client";

import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
}

export function MessageInput({ onSend, isSending }: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setContent("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, isSending, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          rows={1}
          className={cn(
            "flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            "max-h-[120px]"
          )}
        />
        <Button
          size="icon"
          className="rounded-full h-10 w-10 flex-shrink-0"
          onClick={handleSubmit}
          disabled={!content.trim() || isSending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
