"use client";

import Link from "next/link";
import { Loader2, Shield, MoreHorizontal, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import type { CollectivePermissions } from "@ekko/config";

interface CollectiveMembersListProps {
  collectiveId: string;
  collectiveSlug: string;
  viewerPermissions: CollectivePermissions | null;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const roleColors: Record<string, string> = {
  creator: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  moderator: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  editor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  member: "bg-muted text-muted-foreground",
};

export function CollectiveMembersList({
  collectiveId,
  collectiveSlug,
  viewerPermissions,
}: CollectiveMembersListProps) {
  const { user } = useProfile();
  const utils = trpc.useUtils();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.collective.getMembers.useInfiniteQuery(
      { collectiveId, limit: 20 },
      { getNextPageParam: (last) => last.nextCursor }
    );

  const { data: roles } = trpc.collective.getRoles.useQuery(collectiveId, {
    enabled: !!viewerPermissions?.canManageRoles,
  });

  const kickMutation = trpc.collective.kickMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      utils.collective.getMembers.invalidate();
      utils.collective.getBySlug.invalidate(collectiveSlug);
    },
    onError: (err) => toast.error(err.message),
  });

  const assignRoleMutation = trpc.collective.assignRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.collective.getMembers.invalidate();
      utils.collective.getRoles.invalidate(collectiveId);
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
        <p>No members yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-border">
        {members.map((member) => {
          const displayName = member.user.profile?.displayName || "Unknown";
          const username = member.user.profile?.username;
          const roleSlug = member.role.slug;
          const canManage = viewerPermissions?.canManageMembers && roleSlug !== "creator";
          const canAssignRoles = viewerPermissions?.canManageRoles && roleSlug !== "creator";

          return (
            <div key={member.userId} className="flex items-center gap-3 px-4 py-3">
              <Link href={username ? `/profile/${username}` : "#"} className="flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={username ? `/profile/${username}` : "#"}
                  className="font-semibold text-sm hover:underline"
                >
                  {displayName}
                </Link>
                {username && (
                  <p className="text-xs text-muted-foreground">@{username}</p>
                )}
              </div>

              <Badge
                variant="secondary"
                className={`text-xs ${roleColors[roleSlug] || roleColors.member}`}
              >
                {member.role.name}
              </Badge>

              {(canManage || canAssignRoles) && member.userId !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canAssignRoles && roles && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Shield className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {roles
                            .filter((r) => r.slug !== "creator")
                            .map((role) => (
                              <DropdownMenuItem
                                key={role.id}
                                onClick={() =>
                                  assignRoleMutation.mutate({
                                    collectiveId,
                                    userId: member.userId,
                                    roleId: role.id,
                                  })
                                }
                                disabled={role.id === member.role.id}
                              >
                                {role.name}
                                {role.id === member.role.id && " (current)"}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                    {canManage && (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          kickMutation.mutate({
                            collectiveId,
                            userId: member.userId,
                          })
                        }
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove Member
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Show more
          </Button>
        </div>
      )}
    </div>
  );
}
