"use client";

import { useState } from "react";
import { Check, Clock, Inbox, Loader2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@ekko/api";

type AppItem =
  inferRouterOutputs<AppRouter>["signupApplication"]["listAdmin"]["items"][number];

type AppStatus = "PENDING" | "APPROVED" | "WAITLISTED" | "DECLINED";

const filters: AppStatus[] = ["PENDING", "APPROVED", "WAITLISTED", "DECLINED"];

const statusColor: Record<AppStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  WAITLISTED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  DECLINED: "bg-destructive/10 text-destructive",
};

export function ApplicationsAdmin() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<AppStatus>("PENDING");

  const { data: stats } = trpc.signupApplication.adminStats.useQuery();
  const { data, isLoading } = trpc.signupApplication.listAdmin.useQuery({
    status: filter,
    limit: 50,
  });

  const review = trpc.signupApplication.review.useMutation({
    onSuccess: () => {
      utils.signupApplication.listAdmin.invalidate();
      utils.signupApplication.adminStats.invalidate();
      utils.admin.getDashboardStats.invalidate();
      toast.success("Application updated");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
            {stats && (
              <span className="ml-1 opacity-70">
                ({stats[s.toLowerCase() as keyof typeof stats]})
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
          <Inbox className="h-8 w-8 opacity-50" />
          <p>No applications match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onReview={(decision, cohort, notes) =>
                review.mutate({ id: app.id, decision, cohort, notes })
              }
              isPending={review.isPending && review.variables?.id === app.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  onReview,
  isPending,
}: {
  app: AppItem;
  onReview: (decision: "APPROVED" | "WAITLISTED" | "DECLINED", cohort?: string, notes?: string) => void;
  isPending: boolean;
}) {
  const [cohort, setCohort] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{app.email}</p>
            <Badge className={cn("text-[10px]", statusColor[app.status as AppStatus])}>
              {app.status}
            </Badge>
            {app.cohort && (
              <Badge variant="outline" className="text-[10px]">
                {app.cohort}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Clock className="inline h-3 w-3 mr-1" />
            submitted {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
            {app.city ? ` · ${app.city}` : ""}
          </p>
        </div>
        {app.portfolioUrl && (
          <a
            href={app.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Portfolio <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {app.disciplines?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {app.disciplines.map((d: string) => (
            <Badge key={d} variant="secondary" className="text-[10px]">
              {d}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-sm leading-relaxed border-l-2 border-muted-foreground/20 pl-3 text-foreground/90 italic">
        &ldquo;{app.statement}&rdquo;
      </p>

      {app.status === "PENDING" ? (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`cohort-${app.id}`} className="text-xs">
                Cohort (optional)
              </Label>
              <Input
                id={`cohort-${app.id}`}
                placeholder="PUBLIC_W26_C1"
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                maxLength={50}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`notes-${app.id}`} className="text-xs">
                Notes (admin-only)
              </Label>
              <Input
                id={`notes-${app.id}`}
                placeholder="Why this decision?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() =>
                onReview("APPROVED", cohort.trim() || undefined, notes.trim() || undefined)
              }
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                onReview("WAITLISTED", cohort.trim() || undefined, notes.trim() || undefined)
              }
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Waitlist
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                onReview("DECLINED", undefined, notes.trim() || undefined)
              }
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      ) : app.notes ? (
        <p className="text-xs text-muted-foreground border-t pt-2">
          <span className="font-semibold">Admin note:</span> {app.notes}
        </p>
      ) : null}
    </div>
  );
}
