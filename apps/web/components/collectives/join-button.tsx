"use client";

import { useState } from "react";
import { Loader2, UserPlus, UserCheck, UserMinus, Clock, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";

interface JoinButtonProps {
  collectiveId: string;
  collectiveSlug: string;
  joinType: string;
  viewerMembership: {
    status: string;
    role: { name: string; slug: string };
  } | null;
  creatorId: string;
  size?: "default" | "sm";
  className?: string;
}

export function JoinButton({
  collectiveId,
  collectiveSlug,
  joinType,
  viewerMembership,
  creatorId,
  size = "default",
  className,
}: JoinButtonProps) {
  const { user } = useProfile();
  const { promptLogin } = useLoginPrompt();
  const [isHovering, setIsHovering] = useState(false);
  const utils = trpc.useUtils();

  const invalidate = () => {
    utils.collective.getBySlug.invalidate(collectiveSlug);
    utils.collective.getAll.invalidate();
    utils.collective.getMyCollectives.invalidate();
  };

  const joinMutation = trpc.collective.join.useMutation({
    onSuccess: () => {
      toast.success("Joined collective!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const requestMutation = trpc.collective.requestJoin.useMutation({
    onSuccess: () => {
      toast.success("Join request sent!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const leaveMutation = trpc.collective.leave.useMutation({
    onSuccess: () => {
      toast.success("Left collective");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const acceptMutation = trpc.collective.acceptInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite accepted!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const declineMutation = trpc.collective.declineInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite declined");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!user) {
    return (
      <Button
        size={size === "sm" ? "sm" : "default"}
        variant="default"
        onClick={(e) => {
          e.preventDefault();
          promptLogin("Sign in to join this collective.");
        }}
        className={cn("rounded-lg min-w-[100px] font-semibold", className)}
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        Join
      </Button>
    );
  }

  const isMutating =
    joinMutation.isPending ||
    requestMutation.isPending ||
    leaveMutation.isPending ||
    acceptMutation.isPending ||
    declineMutation.isPending;

  const btnSize = size === "sm" ? "sm" : "default";

  // Active member — show Leave (unless creator)
  if (viewerMembership?.status === "ACTIVE") {
    if (user.id === creatorId) return null;

    return (
      <Button
        size={btnSize}
        variant={isHovering ? "destructive" : "outline"}
        onClick={(e) => {
          e.preventDefault();
          leaveMutation.mutate(collectiveId);
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isMutating}
        className={cn("rounded-lg min-w-[100px]", className)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isHovering ? (
          <>
            <UserMinus className="mr-1.5 h-4 w-4" />
            Leave
          </>
        ) : (
          <>
            <UserCheck className="mr-1.5 h-4 w-4" />
            Member
          </>
        )}
      </Button>
    );
  }

  // Pending request
  if (viewerMembership?.status === "PENDING") {
    return (
      <Button
        size={btnSize}
        variant="outline"
        disabled
        className={cn("rounded-lg min-w-[100px]", className)}
      >
        <Clock className="mr-1.5 h-4 w-4" />
        Pending
      </Button>
    );
  }

  // Invited
  if (viewerMembership?.status === "INVITED") {
    return (
      <div className="flex gap-2">
        <Button
          size={btnSize}
          onClick={(e) => {
            e.preventDefault();
            acceptMutation.mutate(collectiveId);
          }}
          disabled={isMutating}
          className={cn("rounded-lg", className)}
        >
          {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept Invite"}
        </Button>
        <Button
          size={btnSize}
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            declineMutation.mutate(collectiveId);
          }}
          disabled={isMutating}
          className="rounded-lg"
        >
          Decline
        </Button>
      </div>
    );
  }

  // Not a member — show join options based on joinType
  if (joinType === "OPEN") {
    return (
      <Button
        size={btnSize}
        onClick={(e) => {
          e.preventDefault();
          joinMutation.mutate(collectiveId);
        }}
        disabled={isMutating}
        className={cn("rounded-lg min-w-[100px] font-semibold", className)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Join
          </>
        )}
      </Button>
    );
  }

  if (joinType === "REQUEST") {
    return (
      <Button
        size={btnSize}
        onClick={(e) => {
          e.preventDefault();
          requestMutation.mutate(collectiveId);
        }}
        disabled={isMutating}
        className={cn("rounded-lg min-w-[120px] font-semibold", className)}
      >
        {isMutating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Request to Join
          </>
        )}
      </Button>
    );
  }

  // Invite only
  return (
    <Button
      size={btnSize}
      variant="outline"
      disabled
      className={cn("rounded-lg min-w-[100px]", className)}
    >
      <Lock className="mr-1.5 h-4 w-4" />
      Invite Only
    </Button>
  );
}
