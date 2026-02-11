"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MoreHorizontal, Trash2, Pin, PinOff, ChevronUp, Bookmark, BookmarkCheck, Share2, Link2, ExternalLink, Flag, BadgeCheck, Volume2, VolumeX, Play } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks";
import { cn } from "@/lib/utils";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";
import { PortfolioBlockRenderer } from "@/components/portfolio/blocks/portfolio-block-renderer";
import { isVideoUrl } from "@/components/ui/media-upload";
import { CommentThread } from "./comment-thread";
import { CommentForm } from "./comment-form";
import { ReportDialog } from "@/components/report/report-dialog";

interface PostCardProps {
  post: {
    id: string;
    content: string | null;
    mediaUrls: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: Date;
    collectiveId?: string | null;
    collective?: { name: string; slug: string } | null;
    user: {
      id: string;
      profile: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
        subscriptionTier?: string | null;
      } | null;
    };
    isPinned?: boolean;
    likes: Array<{ userId: string }>;
    blocks?: Array<{
      id: string;
      type: string;
      content: unknown;
      sortOrder: number;
    }>;
  };
  showPinAction?: boolean;
  isPinned?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function AutoplayVideo({
  src,
  className,
  aspectClassName,
  onClick,
}: {
  src: string;
  className?: string;
  aspectClassName?: string;
  onClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPaused(false);
        } else {
          video.pause();
          setPaused(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(!video.muted ? true : false);
  }, []);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }, [onClick]);

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black overflow-hidden group", aspectClassName, className)}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
      />
      {/* Mute/Unmute toggle */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {muted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      {/* Play indicator when paused */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 rounded-full bg-black/50">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  );
}

export function PostCard({ post, showPinAction, isPinned: isPinnedProp }: PostCardProps) {
  const { user: currentUser } = useUser();
  const { promptLogin } = useLoginPrompt();
  const utils = trpc.useUtils();
  const [showComments, setShowComments] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(
    post.likes.some((like) => like.userId === currentUser?.id)
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Bookmark query
  const { data: bookmarkData } = trpc.bookmark.isBookmarked.useQuery(post.id, {
    enabled: !!currentUser,
  });
  const bookmarked = bookmarkData?.isBookmarked ?? isBookmarked;

  const bookmarkMutation = trpc.bookmark.toggle.useMutation({
    onMutate: () => {
      setIsBookmarked(!bookmarked);
    },
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      utils.bookmark.isBookmarked.setData(post.id, { isBookmarked: data.bookmarked });
    },
    onError: () => {
      setIsBookmarked(bookmarked);
      toast.error("Failed to update bookmark");
    },
  });

  const likeMutation = trpc.post.like.useMutation({
    onMutate: () => {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
    },
    onError: () => {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
      toast.error("Failed to like post");
    },
  });

  const unlikeMutation = trpc.post.unlike.useMutation({
    onMutate: () => {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
    },
    onError: () => {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      toast.error("Failed to unlike post");
    },
  });

  const deleteMutation = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      utils.feed.getChronological.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const pinMutation = trpc.post.pin.useMutation({
    onSuccess: () => {
      toast.success("Post pinned to profile");
      utils.post.getPinnedByUser.invalidate();
      utils.feed.getUserPosts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to pin post");
    },
  });

  const unpinMutation = trpc.post.unpin.useMutation({
    onSuccess: () => {
      toast.success("Post unpinned");
      utils.post.getPinnedByUser.invalidate();
      utils.feed.getUserPosts.invalidate();
    },
    onError: () => {
      toast.error("Failed to unpin post");
    },
  });

  const postIsPinned = isPinnedProp ?? post.isPinned;
  const postRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const trackPostView = trpc.analytics.trackPostView.useMutation();

  useEffect(() => {
    if (viewTracked.current) return;
    const el = postRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewTracked.current) {
          viewTracked.current = true;
          trackPostView.mutate(post.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id]);

  const handleLikeToggle = () => {
    if (!currentUser) {
      promptLogin("Sign in to like posts.");
      return;
    }

    if (isLiked) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(post.id);
    }
  };

  const handleBookmarkToggle = () => {
    if (!currentUser) {
      promptLogin("Sign in to bookmark posts.");
      return;
    }
    bookmarkMutation.mutate(post.id);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleShareTwitter = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = post.content ? post.content.slice(0, 200) : "Check out this post on EKKO";
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const handleShareLinkedIn = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const isOwnPost = currentUser?.id === post.user.id;
  const profile = post.user.profile;

  // Find the first image URL for ambient background
  const getFirstImageUrl = (): string | undefined => {
    const fromMedia = post.mediaUrls.find((url) => !isVideoUrl(url));
    if (fromMedia) return fromMedia;
    if (post.blocks) {
      for (const b of post.blocks) {
        const c = b.content as Record<string, unknown>;
        if (b.type === "IMAGE" && c?.url) return c.url as string;
        if (b.type === "IMAGE_GALLERY") {
          const imgs = c?.images as Array<{ url: string }> | undefined;
          if (imgs?.[0]?.url) return imgs[0].url;
        }
      }
    }
    return undefined;
  };
  const firstImageUrl = getFirstImageUrl();

  const hasBgMedia = !!firstImageUrl;

  return (
    <div ref={postRef} className={cn("relative isolate rounded-2xl overflow-hidden", hasBgMedia ? "border" : "glass-card")}>
      {/* Ambient blurred background from media */}
      {hasBgMedia && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover blur-lg scale-125 opacity-70 dark:opacity-50 pointer-events-none"
          />
          <div className="absolute inset-0 bg-background/30 dark:bg-background/40 pointer-events-none" />
        </>
      )}

      {/* Card content */}
      <div className="relative z-10 p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${profile?.username || ""}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {profile?.displayName
                  ? getInitials(profile.displayName)
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-1">
              <Link
                href={`/profile/${profile?.username || ""}`}
                className="font-medium hover:underline"
              >
                {profile?.displayName || "Unknown User"}
              </Link>
              {(profile?.subscriptionTier === "PRO" || profile?.subscriptionTier === "BUSINESS") && (
                <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              @{profile?.username || "unknown"} ·{" "}
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
              {post.collective && (
                <>
                  {" · in "}
                  <Link
                    href={`/collectives/${post.collective.slug}`}
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.collective.name}
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && showPinAction && (
                <DropdownMenuItem
                  onClick={() => {
                    if (postIsPinned) {
                      unpinMutation.mutate(post.id);
                    } else {
                      pinMutation.mutate(post.id);
                    }
                  }}
                  disabled={pinMutation.isPending || unpinMutation.isPending}
                >
                  {postIsPinned ? (
                    <>
                      <PinOff className="mr-2 h-4 w-4" />
                      Unpin from profile
                    </>
                  ) : (
                    <>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin to profile
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {isOwnPost && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="mt-3 overflow-hidden">
          <p className="whitespace-pre-line break-words">
            {post.content.split(/(#\w+)/g).map((part, i) =>
              /^#\w+$/.test(part) ? (
                <Link
                  key={i}
                  href={`/discover?tag=${part.slice(1).toLowerCase()}`}
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                </Link>
              ) : (
                part
              )
            )}
          </p>
        </div>
      )}

      {/* Blocks (Text, Image, Gallery, Video, Audio, 3D Model, Embed) */}
      {post.blocks && post.blocks.length > 0 && (
        <div className="mt-3 space-y-4 overflow-hidden">
          {post.blocks.map((block) => (
            <PortfolioBlockRenderer key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Media (images + videos) */}
      {post.mediaUrls.length > 0 && (
        <>
          <div
            className={cn(
              "mt-3 grid gap-1 rounded-xl overflow-hidden",
              post.mediaUrls.length === 1 && "grid-cols-1",
              post.mediaUrls.length === 2 && "grid-cols-2",
              post.mediaUrls.length === 3 && "grid-cols-2",
              post.mediaUrls.length >= 4 && "grid-cols-2"
            )}
          >
            {post.mediaUrls.slice(0, 4).map((url, index) => {
              const isSingle = post.mediaUrls.length === 1;
              const aspectCls = isSingle
                ? ""
                : cn(
                    post.mediaUrls.length === 2 && "aspect-square",
                    post.mediaUrls.length === 3 && index === 0
                      ? "row-span-2 aspect-[3/4]"
                      : post.mediaUrls.length === 3 && "aspect-square",
                    post.mediaUrls.length >= 4 && "aspect-square"
                  );

              if (isVideoUrl(url)) {
                return (
                  <div key={index} className="relative">
                    <AutoplayVideo
                      src={url}
                      aspectClassName={aspectCls}
                    />
                    {index === 3 && post.mediaUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xl font-bold">
                          +{post.mediaUrls.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // Single image: natural aspect ratio
              if (isSingle) {
                return (
                  <div key={index} className="relative bg-muted overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-full h-auto object-contain max-h-[600px]"
                    />
                  </div>
                );
              }

              // Multi-image grid: fixed aspect ratio with cover
              return (
                <div
                  key={index}
                  className={cn(
                    "relative bg-muted overflow-hidden",
                    aspectCls
                  )}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                  {index === 3 && post.mediaUrls.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        +{post.mediaUrls.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeToggle}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              isLiked
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart
              className={cn("h-5 w-5", isLiked && "fill-current")}
            />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              showComments
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span>{commentsCount}</span>
            {showComments && <ChevronUp className="h-3.5 w-3.5 ml-0.5" />}
          </button>

          {/* Share */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Link2 className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShareTwitter}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Share to X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareLinkedIn}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Share to LinkedIn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmarkToggle}
          className={cn(
            "flex items-center text-sm transition-colors",
            bookmarked
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-5 w-5 fill-current" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t space-y-4">
          <CommentThread
            postId={post.id}
            onCommentDeleted={() => setCommentsCount((prev) => Math.max(0, prev - 1))}
          />
          <CommentForm
            postId={post.id}
            onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
          />
        </div>
      )}

      {/* Report Dialog */}
      <ReportDialog
        targetType="POST"
        targetId={post.id}
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
      />
      </div>{/* close z-10 content wrapper */}
    </div>
  );
}
