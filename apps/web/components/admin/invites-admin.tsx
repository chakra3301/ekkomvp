"use client";

import { useMemo, useState } from "react";
import { Copy, Loader2, Sparkles, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@ekko/api";

type InviteRowItem = inferRouterOutputs<AppRouter>["invite"]["adminList"][number];

type StatusFilter = "ALL" | "ACTIVE" | "REDEEMED" | "EXPIRED" | "REVOKED";

const statusFilters: StatusFilter[] = ["ALL", "ACTIVE", "REDEEMED", "EXPIRED", "REVOKED"];

function formatCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function InvitesAdmin() {
  const utils = trpc.useUtils();

  // Mint form state
  const [count, setCount] = useState(1);
  const [isFounder, setIsFounder] = useState(false);
  const [cohort, setCohort] = useState("");
  const [label, setLabel] = useState("");
  const [ttlDays, setTtlDays] = useState(90);
  const [recentlyMinted, setRecentlyMinted] = useState<string[]>([]);

  // List state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [foundersOnly, setFoundersOnly] = useState(false);

  const { data: invites, isLoading } = trpc.invite.adminList.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    isFounder: foundersOnly ? true : undefined,
    limit: 100,
  });

  const adminMint = trpc.invite.adminMint.useMutation({
    onSuccess: (res) => {
      setRecentlyMinted(res.codes);
      utils.invite.adminList.invalidate();
      utils.admin.getDashboardStats.invalidate();
      toast.success(`Minted ${res.codes.length} code${res.codes.length === 1 ? "" : "s"}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const activeUnredeemed = useMemo(
    () =>
      (invites ?? []).filter(
        (i) => i.status === "ACTIVE" && new Date(i.expiresAt) > new Date()
      ),
    [invites]
  );

  const handleMint = () => {
    adminMint.mutate({
      count,
      isFounder,
      cohort: cohort.trim() || undefined,
      label: label.trim() || undefined,
      ttlDays,
    });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't access clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Mint form */}
      <section className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Mint codes</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mint-count">Count</Label>
            <Input
              id="mint-count"
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mint-ttl">Expiry (days)</Label>
            <Input
              id="mint-ttl"
              type="number"
              min={1}
              max={365}
              value={ttlDays}
              onChange={(e) => setTtlDays(Math.max(1, Math.min(365, Number(e.target.value) || 90)))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mint-cohort">Cohort (optional)</Label>
            <Input
              id="mint-cohort"
              placeholder="FOUNDERS_S26"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mint-label">Label (admin-only, optional)</Label>
            <Input
              id="mint-label"
              placeholder="Apple App Review"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={80}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div>
            <Label htmlFor="mint-founder" className="font-medium">
              Founder code
            </Label>
            <p className="text-xs text-muted-foreground">
              Grants INFINITE Connect tier on redemption + founder badge.
            </p>
          </div>
          <Switch id="mint-founder" checked={isFounder} onCheckedChange={setIsFounder} />
        </div>

        <Button onClick={handleMint} disabled={adminMint.isPending} className="w-full sm:w-auto">
          {adminMint.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate {count} code{count === 1 ? "" : "s"}
        </Button>

        {recentlyMinted.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Just minted ({recentlyMinted.length})
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copy(recentlyMinted.map(formatCode).join("\n"), "All codes")
                  }
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy all
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRecentlyMinted([])}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {recentlyMinted.map(formatCode).join("\n")}
            </pre>
          </div>
        )}
      </section>

      {/* List */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <button
            onClick={() => setFoundersOnly((v) => !v)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1",
              foundersOnly
                ? "bg-amber-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Founders
          </button>
          {activeUnredeemed.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() =>
                copy(
                  activeUnredeemed.map((i) => formatCode(i.code)).join("\n"),
                  `${activeUnredeemed.length} active codes`
                )
              }
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy {activeUnredeemed.length} active
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !invites?.length ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
            <Ticket className="h-8 w-8 opacity-50" />
            <p>No invites match this filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <InviteRow key={invite.code} invite={invite} onCopy={copy} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InviteRow({
  invite,
  onCopy,
}: {
  invite: InviteRowItem;
  onCopy: (text: string, label: string) => void;
}) {
  const expired = new Date(invite.expiresAt) < new Date();
  const effectiveStatus = expired && invite.status === "ACTIVE" ? "EXPIRED" : invite.status;

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    REDEEMED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    EXPIRED: "bg-muted text-muted-foreground",
    REVOKED: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 flex flex-wrap items-center gap-3">
      <button
        onClick={() => onCopy(formatCode(invite.code), `Code ${formatCode(invite.code)}`)}
        className="font-mono text-sm tracking-wide px-2.5 py-1 rounded-md bg-muted hover:bg-muted/70 transition-colors"
        title="Click to copy"
      >
        {formatCode(invite.code)}
      </button>

      <div className="flex flex-wrap gap-1.5">
        <Badge className={cn("text-[10px]", statusColor[effectiveStatus] ?? "")}>
          {effectiveStatus}
        </Badge>
        {invite.isFounder && (
          <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400">
            Founder
          </Badge>
        )}
        {invite.cohort && (
          <Badge variant="outline" className="text-[10px]">
            {invite.cohort}
          </Badge>
        )}
        {invite.label && (
          <Badge variant="outline" className="text-[10px]">
            {invite.label}
          </Badge>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        {invite.redeemedBy ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={invite.redeemedBy.profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {invite.redeemedBy.profile?.displayName?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span>
              by @{invite.redeemedBy.profile?.username ?? invite.redeemedBy.id.slice(0, 6)}
            </span>
          </div>
        ) : (
          <span>
            expires{" "}
            {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
          </span>
        )}

        <span className="hidden sm:inline">
          minted {formatDistanceToNow(new Date(invite.issuedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
