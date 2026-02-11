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
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type AdminTab = "reports" | "users" | "content";

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

  const tabs: { key: AdminTab; label: string }[] = [
    { key: "reports", label: "Reports" },
    { key: "users", label: "Users" },
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 py-4">
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
                {userData.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 sm:p-4 gap-2 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
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

                    <div className="flex gap-2">
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
                ))}
              </div>
            )}
          </div>
        )}

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
