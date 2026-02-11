"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks";

interface CommentThreadProps {
  postId: string;
  onCommentDeleted?: () => void;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function CommentThread({ postId, onCommentDeleted }: CommentThreadProps) {
  const { user: currentUser } = useUser();
  const utils = trpc.useUtils();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.post.getComments.useInfiniteQuery(
      { postId, limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const deleteMutation = trpc.post.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted");
      utils.post.getComments.invalidate({ postId });
      onCommentDeleted?.();
      setDeletingId(null);
    },
    onError: () => {
      toast.error("Failed to delete comment");
      setDeletingId(null);
    },
  });

  const comments = data?.pages.flatMap((page) => page.comments) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="py-3 text-sm text-muted-foreground text-center">
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => {
        const profile = comment.user.profile;
        const isOwn = currentUser?.id === comment.user.id;

        return (
          <div key={comment.id} className="flex gap-2.5 group">
            <Link href={`/profile/${profile?.username || ""}`} className="shrink-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {profile?.displayName ? getInitials(profile.displayName) : "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/profile/${profile?.username || ""}`}
                  className="text-sm font-medium hover:underline truncate"
                >
                  {profile?.displayName || "Unknown"}
                </Link>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {isOwn && (
                  <button
                    onClick={() => {
                      if (confirm("Delete this comment?")) {
                        setDeletingId(comment.id);
                        deleteMutation.mutate(comment.id);
                      }
                    }}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-line break-words">{comment.content}</p>
            </div>
          </div>
        );
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-xs text-muted-foreground"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : null}
            Load more comments
          </Button>
        </div>
      )}
    </div>
  );
}
