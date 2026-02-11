"use client";

import { useState } from "react";
import { Loader2, UserPlus, UserCheck, UserMinus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { cn } from "@/lib/utils";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";

interface FollowButtonProps {
  userId: string;
  size?: "default" | "sm";
  className?: string;
}

export function FollowButton({ userId, size = "default", className }: FollowButtonProps) {
  const { user } = useProfile();
  const { promptLogin } = useLoginPrompt();
  const [isHovering, setIsHovering] = useState(false);
  const utils = trpc.useUtils();

  const { data, isLoading: checkingFollow } = trpc.follow.isFollowing.useQuery(userId, {
    enabled: !!user && user.id !== userId,
  });

  const followMutation = trpc.follow.follow.useMutation({
    onMutate: async () => {
      await utils.follow.isFollowing.cancel(userId);
      const prev = utils.follow.isFollowing.getData(userId);
      utils.follow.isFollowing.setData(userId, { isFollowing: true });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        utils.follow.isFollowing.setData(userId, context.prev);
      }
    },
    onSettled: () => {
      utils.follow.isFollowing.invalidate(userId);
      utils.profile.getByUsername.invalidate();
      utils.profile.getCurrent.invalidate();
    },
  });

  const unfollowMutation = trpc.follow.unfollow.useMutation({
    onMutate: async () => {
      await utils.follow.isFollowing.cancel(userId);
      const prev = utils.follow.isFollowing.getData(userId);
      utils.follow.isFollowing.setData(userId, { isFollowing: false });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        utils.follow.isFollowing.setData(userId, context.prev);
      }
    },
    onSettled: () => {
      utils.follow.isFollowing.invalidate(userId);
      utils.profile.getByUsername.invalidate();
      utils.profile.getCurrent.invalidate();
    },
  });

  // Don't show for own profile
  if (user && user.id === userId) return null;

  // Show follow button that triggers login prompt for unauthenticated users
  if (!user) {
    return (
      <Button
        size={size === "sm" ? "sm" : "default"}
        variant="default"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          promptLogin("Sign in to follow this user.");
        }}
        className={cn("rounded-lg min-w-[100px] font-semibold", size === "sm" && "min-w-[90px]", className)}
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        Follow
      </Button>
    );
  }

  const isFollowing = data?.isFollowing ?? false;
  const isMutating = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMutating) return;

    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  if (checkingFollow) {
    return (
      <Button
        size={size === "sm" ? "sm" : "default"}
        variant="outline"
        disabled
        className={cn("rounded-lg", className)}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        size={size === "sm" ? "sm" : "default"}
        variant={isHovering ? "destructive" : "outline"}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isMutating}
        className={cn("rounded-lg min-w-[100px]", size === "sm" && "min-w-[90px]", className)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isHovering ? (
          <>
            <UserMinus className="mr-1.5 h-4 w-4" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="mr-1.5 h-4 w-4" />
            Following
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size={size === "sm" ? "sm" : "default"}
      variant="default"
      onClick={handleClick}
      disabled={isMutating}
      className={cn("rounded-lg min-w-[100px] font-semibold", size === "sm" && "min-w-[90px]", className)}
    >
      {isMutating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
