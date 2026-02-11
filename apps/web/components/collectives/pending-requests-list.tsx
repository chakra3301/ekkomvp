"use client";

import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";

interface PendingRequestsListProps {
  collectiveId: string;
  collectiveSlug: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function PendingRequestsList({ collectiveId, collectiveSlug }: PendingRequestsListProps) {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.collective.getPendingRequests.useInfiniteQuery(
    { collectiveId, limit: 20 },
    { getNextPageParam: (last) => last.nextCursor }
  );

  const approveMutation = trpc.collective.approveRequest.useMutation({
    onSuccess: () => {
      toast.success("Request approved");
      utils.collective.getPendingRequests.invalidate();
      utils.collective.getMembers.invalidate();
      utils.collective.getBySlug.invalidate(collectiveSlug);
    },
    onError: (err) => toast.error(err.message),
  });

  const denyMutation = trpc.collective.denyRequest.useMutation({
    onSuccess: () => {
      toast.success("Request denied");
      utils.collective.getPendingRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const members = data?.pages.flatMap((p) => p.members) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const displayName = member.user.profile?.displayName || "Unknown";
        const username = member.user.profile?.username;
        const isMutating = approveMutation.isPending || denyMutation.isPending;

        return (
          <div
            key={member.userId}
            className="flex items-center gap-3 p-3 rounded-lg border border-border"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.user.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{displayName}</p>
              {username && (
                <p className="text-xs text-muted-foreground">@{username}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  approveMutation.mutate({ collectiveId, userId: member.userId })
                }
                disabled={isMutating}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  denyMutation.mutate({ collectiveId, userId: member.userId })
                }
                disabled={isMutating}
              >
                <X className="h-4 w-4 mr-1" />
                Deny
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
