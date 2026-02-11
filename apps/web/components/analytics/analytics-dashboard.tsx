"use client";

import { useState } from "react";
import {
  BarChart3,
  Eye,
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Bookmark,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

export function AnalyticsDashboard() {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { data: tierData } = trpc.subscription.getCurrentTier.useQuery();
  const { data: analytics, isLoading } = trpc.analytics.getProfileAnalytics.useQuery();

  const hasAccess = tierData?.tier === "PRO" || tierData?.tier === "BUSINESS";

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Free tier - show locked state
  if (!hasAccess) {
    return (
      <div>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Analytics</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock Analytics</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get insights into your profile views, post engagement, and follower
            growth with an EKKO Pro or Business plan.
          </p>
          <Button onClick={() => setUpgradeModalOpen(true)} size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
          <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No analytics data available yet.
      </div>
    );
  }

  const maxDailyViews = Math.max(...analytics.dailyViews.map((d) => d.count), 1);

  return (
    <div>
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Analytics</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Profile Views</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{analytics.profileViews30d}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium">Post Views</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{analytics.totalPostViews30d}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Followers</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{analytics.totalFollowers}</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">New Followers</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">+{analytics.newFollowers30d}</p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </div>

        {/* Profile Views Chart */}
        <section className="space-y-3">
          <h2 className="font-semibold">Profile Views (30 days)</h2>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-end gap-[2px] h-32 overflow-hidden">
              {analytics.dailyViews.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div
                    className="w-full bg-primary/80 rounded-t-sm min-h-[2px] transition-all hover:bg-primary"
                    style={{
                      height: `${Math.max((day.count / maxDailyViews) * 100, 2)}%`,
                    }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-foreground text-background text-xs rounded whitespace-nowrap z-10">
                    {day.date}: {day.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{analytics.dailyViews[0]?.date.slice(5)}</span>
              <span>{analytics.dailyViews[analytics.dailyViews.length - 1]?.date.slice(5)}</span>
            </div>
          </div>
        </section>

        {/* Top Posts */}
        <section className="space-y-3">
          <h2 className="font-semibold">Top Posts</h2>
          {analytics.topPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No posts yet. Create your first post to see analytics.
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.topPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {post.content?.slice(0, 80) || "Media post"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-shrink-0 flex-wrap">
                    <span className="flex items-center gap-1" title="Views">
                      <Eye className="h-3.5 w-3.5" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1" title="Likes">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1" title="Comments">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.commentsCount}
                    </span>
                    <span className="flex items-center gap-1" title="Bookmarks">
                      <Bookmark className="h-3.5 w-3.5" />
                      {post.bookmarksCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
