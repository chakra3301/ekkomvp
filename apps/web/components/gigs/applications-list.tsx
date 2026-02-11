"use client";

import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

interface ApplicationsListProps {
  projectId: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600",
  VIEWED: "bg-blue-500/10 text-blue-600",
  SHORTLISTED: "bg-purple-500/10 text-purple-600",
  ACCEPTED: "bg-green-500/10 text-green-600",
  DECLINED: "bg-red-500/10 text-red-600",
};

export function ApplicationsList({ projectId }: ApplicationsListProps) {
  const utils = trpc.useUtils();

  const { data: applications, isLoading } = trpc.application.getForProject.useQuery(projectId);

  const acceptMutation = trpc.application.accept.useMutation({
    onSuccess: () => {
      toast.success("Application accepted! Work order created.");
      utils.application.getForProject.invalidate(projectId);
      utils.project.getById.invalidate(projectId);
    },
    onError: (error) => toast.error(error.message),
  });

  const declineMutation = trpc.application.decline.useMutation({
    onSuccess: () => {
      toast.success("Application declined.");
      utils.application.getForProject.invalidate(projectId);
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No applications yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Applications ({applications.length})
      </h3>

      {applications.map((app) => {
        const name = app.creative.profile?.displayName || "Creative";
        const isPending = app.status === "PENDING" || app.status === "VIEWED" || app.status === "SHORTLISTED";

        return (
          <div
            key={app.id}
            className="rounded-lg border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={app.creative.profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{app.creative.profile?.username}
                    {app.creative.profile?.headline && ` · ${app.creative.profile.headline}`}
                  </p>
                </div>
              </div>

              <Badge className={statusColors[app.status] || ""} variant="secondary">
                {app.status}
              </Badge>
            </div>

            {/* Cover letter */}
            <p className="text-sm">{app.coverLetter}</p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {app.proposedRate && (
                <span className="font-medium text-foreground">${app.proposedRate}</span>
              )}
              {app.timeline && <span>{app.timeline}</span>}
              <span>{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</span>
            </div>

            {/* Actions */}
            {isPending && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate(app.id)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => declineMutation.mutate(app.id)}
                  disabled={acceptMutation.isPending || declineMutation.isPending}
                >
                  {declineMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Decline
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
