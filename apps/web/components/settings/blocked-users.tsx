"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function BlockedUsers() {
  const utils = trpc.useUtils();
  const { data: blockedUsers, isLoading } = trpc.block.getBlockedUsers.useQuery();

  const unblockMutation = trpc.block.unblock.useMutation({
    onSuccess: () => {
      utils.block.getBlockedUsers.invalidate();
      toast.success("User unblocked");
    },
    onError: () => {
      toast.error("Failed to unblock user");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!blockedUsers || blockedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        You haven&apos;t blocked anyone.
      </div>
    );
  }

  return (
    <div className="space-y-1 rounded-lg border bg-card overflow-hidden">
      {blockedUsers.map((user, i) => (
        <div
          key={user.id}
          className={`flex items-center justify-between p-4 ${i > 0 ? "border-t" : ""}`}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-muted text-xs">
                {user.profile?.displayName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{user.profile?.displayName || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">@{user.profile?.username || "user"}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => unblockMutation.mutate(user.id)}
            disabled={unblockMutation.isPending}
          >
            Unblock
          </Button>
        </div>
      ))}
    </div>
  );
}
