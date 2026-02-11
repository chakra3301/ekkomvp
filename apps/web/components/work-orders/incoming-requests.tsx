"use client";

import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function IncomingRequests() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.project.getDirectRequests.useInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const acceptMutation = trpc.workorder.acceptDirectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request accepted! Work order created.");
      utils.project.getDirectRequests.invalidate();
      utils.workorder.getMyWorkOrders.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const declineMutation = trpc.workorder.declineDirectRequest.useMutation({
    onSuccess: () => {
      toast.success("Request declined.");
      utils.project.getDirectRequests.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Incoming Work Requests ({projects.length})
      </h3>

      {projects.map((project) => {
        const clientName = project.client.profile?.companyName || project.client.profile?.displayName || "Client";
        const formatBudget = () => {
          if (!project.budgetMin && !project.budgetMax) return null;
          const suffix = project.budgetType === "HOURLY" ? "/hr" : "";
          if (project.budgetMin && project.budgetMax && project.budgetMin !== project.budgetMax) {
            return `$${project.budgetMin} - $${project.budgetMax}${suffix}`;
          }
          return `$${project.budgetMax || project.budgetMin}${suffix}`;
        };

        return (
          <div key={project.id} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={project.client.profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">{project.title}</h4>
                <p className="text-sm text-muted-foreground">
                  from {clientName}
                  {" · "}
                  {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <p className="text-sm line-clamp-3">{project.description}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {formatBudget() && (
                <Badge variant="outline">{formatBudget()}</Badge>
              )}
              {project.discipline && (
                <Badge variant="secondary" className="text-xs">
                  {project.discipline.name}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate(project.id)}
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
                onClick={() => declineMutation.mutate(project.id)}
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
          </div>
        );
      })}
    </div>
  );
}
