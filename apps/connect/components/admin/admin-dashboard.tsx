"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  AlertTriangle,
  Ban,
  Shield,
  Loader2,
  Check,
  X,
  Eye,
  Trash2,
  Ticket,
  Inbox,
  Crown,
  Star,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { InvitesAdmin } from "./invites-admin";
import { ApplicationsAdmin } from "./applications-admin";

type AdminTab = "reports" | "users" | "content" | "invites" | "applications";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("reports");
  const [userSearch, setUserSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<string>("PENDING");
  const utils = trpc.useUtils();

  // Stats
  const { data: stats } = trpc.admin.getDashboardStats.useQuery();

  // Reports
  const { data: reportData, isLoading: reportsLoading } = trpc.report.getAll.useQuery(
    { status: reportFilter as "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED", limit: 20 },
    { enabled: activeTab === "reports" }
  );
  const { data: reportStats } = trpc.report.getStats.useQuery(undefined, {
    enabled: activeTab === "reports",
  });

  // Users
  const { data: userData, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { query: userSearch || undefined, limit: 20 },
    { enabled: activeTab === "users" }
  );

  // Mutations
  const updateReportStatus = trpc.report.updateStatus.useMutation({
    onSuccess: () => {
      utils.report.getAll.invalidate();
      utils.report.getStats.invalidate();
      utils.admin.getDashboardStats.invalidate();
      toast.success("Report updated");
    },
  });

  const suspendUser = trpc.admin.suspendUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      utils.admin.getDashboardStats.invalidate();
      toast.success("User suspended");
    },
  });

  const unsuspendUser = trpc.admin.unsuspendUser.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      utils.admin.getDashboardStats.invalidate();
      toast.success("User unsuspended");
    },
  });

  const deletePost = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      utils.report.getAll.invalidate();
      toast.success("Post deleted");
    },
  });

  // Per-user badge toggle. The same mutation backs the CEO / OA / GM
  // pills below — each pill calls it with one of the optional fields set.
  // Re-fetches getUsers on success so the toggle reflects fresh state
  // immediately.
  const setUserBadges = trpc.admin.setUserBadges.useMutation({
    onSuccess: () => {
      utils.admin.getUsers.invalidate();
      toast.success("Badges updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "reports", label: "Reports" },
    { key: "users", label: "Users" },
    { key: "invites", label: "Invites" },
    { key: "applications", label: "Applications" },
    { key: "content", label: "Content" },
  ];

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-4 py-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Active Users</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.totalUsers ?? "—"}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Total Posts</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.totalPosts ?? "—"}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Pending Reports</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{stats?.pendingReports ?? "—"}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Ban className="h-4 w-4" />
            <span className="text-xs font-medium">Suspended</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.suspendedUsers ?? "—"}</p>
        </div>
        <button
          onClick={() => setActiveTab("applications")}
          className="p-4 rounded-lg border bg-card text-left hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Inbox className="h-4 w-4" />
            <span className="text-xs font-medium">Pending Apps</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.pendingApplications ?? "—"}</p>
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className="p-4 rounded-lg border bg-card text-left hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Ticket className="h-4 w-4" />
            <span className="text-xs font-medium">Active Invites</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.activeInvites ?? "—"}</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Report status filters */}
            <div className="flex gap-2 flex-wrap">
              {["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setReportFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-full transition-colors",
                    reportFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  {reportStats && (
                    <span className="ml-1 opacity-70">
                      ({reportStats[status.toLowerCase() as keyof typeof reportStats]})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {reportsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !reportData?.reports.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No reports found.
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.reports.map((report) => (
                  <div key={report.id} className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {report.targetType}
                          </Badge>
                          <Badge
                            variant={report.reason === "SPAM" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {report.reason.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Reported by @{report.reporter?.username || "unknown"}{" "}
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </p>
                        {report.description && (
                          <p className="text-sm mt-2">{report.description}</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {report.targetId.slice(0, 8)}...
                      </p>
                    </div>

                    {report.status === "PENDING" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateReportStatus.mutate({ id: report.id, status: "REVIEWED" })
                          }
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Review
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            updateReportStatus.mutate({ id: report.id, status: "RESOLVED" })
                          }
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateReportStatus.mutate({ id: report.id, status: "DISMISSED" })
                          }
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Dismiss
                        </Button>
                        {report.targetType === "POST" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Delete this post?")) {
                                deletePost.mutate(report.targetId);
                                updateReportStatus.mutate({ id: report.id, status: "RESOLVED" });
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete Post
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <Input
              placeholder="Search users by name, username, or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rounded-lg bg-muted border-0"
            />

            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !userData?.users.length ? (
              <div className="text-center py-8 text-muted-foreground">No users found.</div>
            ) : (
              <div className="space-y-2">
                {userData.users.map((user) => {
                  const isAdminUser = user.role === "ADMIN";
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profile?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-muted text-sm">
                              {user.profile?.displayName?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">
                                {user.profile?.displayName || user.email}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                              {user.status === "SUSPENDED" && (
                                <Badge variant="destructive" className="text-xs">
                                  Suspended
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              @{user.profile?.username || "—"} · {user._count.posts} posts
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {user.status === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Suspend ${user.profile?.displayName || user.email}?`)) {
                                  suspendUser.mutate(user.id);
                                }
                              }}
                            >
                              <Ban className="h-3.5 w-3.5 mr-1" />
                              Suspend
                            </Button>
                          ) : user.status === "SUSPENDED" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unsuspendUser.mutate(user.id)}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Unsuspend
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      {/* Badge toggles. Each chip calls setUserBadges with
                          ONE field set — the others stay at their current
                          values server-side. Updates show in iOS within one
                          profile fetch / pull-to-refresh, no redeploy. */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t">
                        <BadgeToggle
                          label="CEO"
                          icon={<Crown className="h-3.5 w-3.5" />}
                          on={user.hasCeoBadge}
                          tone="ceo"
                          disabled={setUserBadges.isPending}
                          onClick={() =>
                            setUserBadges.mutate({
                              userId: user.id,
                              hasCeoBadge: !user.hasCeoBadge,
                            })
                          }
                        />
                        <BadgeToggle
                          label="OA"
                          icon={<Star className="h-3.5 w-3.5" />}
                          on={user.isOriginalArtist}
                          tone="oa"
                          disabled={setUserBadges.isPending}
                          onClick={() =>
                            setUserBadges.mutate({
                              userId: user.id,
                              isOriginalArtist: !user.isOriginalArtist,
                            })
                          }
                        />
                        <BadgeToggle
                          label="GM"
                          icon={<ShieldCheck className="h-3.5 w-3.5" />}
                          on={isAdminUser}
                          tone="gm"
                          disabled={setUserBadges.isPending}
                          onClick={() => {
                            const label = user.profile?.displayName || user.email;
                            const verb = isAdminUser ? "Remove admin from" : "Make admin:";
                            if (
                              confirm(
                                `${verb} ${label}? This grants/revokes full moderation access.`
                              )
                            ) {
                              setUserBadges.mutate({
                                userId: user.id,
                                makeAdmin: !isAdminUser,
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === "invites" && <InvitesAdmin />}

        {/* Applications Tab */}
        {activeTab === "applications" && <ApplicationsAdmin />}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Content Moderation</h3>
            <p className="text-sm">
              Review reported content in the Reports tab. Use the action buttons to resolve, dismiss, or remove content.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact toggle pill for assigning a chrome / iridescent badge to a
// user. Renders ON/OFF state with a per-tone color for instant scan in
// the user list.
function BadgeToggle({
  label,
  icon,
  on,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  tone: "ceo" | "oa" | "gm";
  disabled: boolean;
  onClick: () => void;
}) {
  // Mirror the iridescent palettes used in iOS so the admin UI hints at
  // the same identity. Subdued when off, saturated when on.
  const toneClasses: Record<typeof tone, { on: string; off: string }> = {
    ceo: {
      on: "bg-violet-500/15 text-violet-300 border-violet-500/40 hover:bg-violet-500/25",
      off: "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
    },
    oa: {
      on: "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25",
      off: "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
    },
    gm: {
      on: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25",
      off: "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
    },
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 disabled:pointer-events-none",
        on ? toneClasses[tone].on : toneClasses[tone].off
      )}
      aria-pressed={on}
    >
      {icon}
      {label}
      {on && <Check className="h-3 w-3" />}
    </button>
  );
}
