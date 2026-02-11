"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { PostCard } from "@/components/feed/post-card";
import { CommentThread } from "@/components/feed/comment-thread";
import { CommentForm } from "@/components/feed/comment-form";

interface SinglePostPageProps {
  postId: string;
}

export function SinglePostPage({ postId }: SinglePostPageProps) {
  const router = useRouter();
  const { data: post, isLoading } = trpc.post.getById.useQuery(postId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold mb-2">Post not found</h2>
        <p className="text-muted-foreground">
          This post may have been deleted or doesn&apos;t exist.
        </p>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-6 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <PostCard post={post} />

        <div className="bg-card rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold">Comments</h3>
          <CommentThread postId={postId} />
          <CommentForm postId={postId} />
        </div>
      </div>
    </div>
  );
}
