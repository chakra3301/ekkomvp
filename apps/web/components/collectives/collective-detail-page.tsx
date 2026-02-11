"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Users, FileText, Layers, Settings, Lock, Globe, PenSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { cn } from "@/lib/utils";
import { JoinButton } from "./join-button";
import { CollectivePostsFeed } from "./collective-posts-feed";
import { CollectivePortfolioGrid } from "./collective-portfolio-grid";
import { CollectiveMembersList } from "./collective-members-list";
import { CreateCollectivePostModal } from "./create-collective-post-modal";
import { CollectiveSettingsModal } from "./collective-settings";
import type { CollectivePermissions } from "@ekko/config";

interface CollectiveDetailPageProps {
  slug: string;
}

type Tab = "posts" | "portfolio" | "members";

export function CollectiveDetailPage({ slug }: CollectiveDetailPageProps) {
  const { user } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: collective, isLoading } = trpc.collective.getBySlug.useQuery(slug);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collective) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Collective not found</p>
      </div>
    );
  }

  const viewerPerms = collective.viewerMembership?.role?.permissions as CollectivePermissions | null;
  const isActiveMember = collective.viewerMembership?.status === "ACTIVE";
  const canPost = isActiveMember && viewerPerms?.canPost;
  const canManageCollective = isActiveMember && viewerPerms?.canManageCollective;
  const canEditPortfolio = isActiveMember && viewerPerms?.canEditPortfolio;

  const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "posts", label: "Posts", icon: FileText },
    { id: "portfolio", label: "Portfolio", icon: Layers },
    { id: "members", label: "Members", icon: Users },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Banner */}
      <div className="h-32 sm:h-48 bg-muted relative overflow-hidden">
        {collective.bannerUrl ? (
          <Image
            src={collective.bannerUrl}
            alt={collective.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{collective.name}</h1>
              <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                {collective.visibility === "PRIVATE" ? (
                  <><Lock className="h-3 w-3" /> Private</>
                ) : (
                  <><Globe className="h-3 w-3" /> Public</>
                )}
              </Badge>
            </div>

            {collective.description && (
              <p className="mt-1 text-sm text-muted-foreground">{collective.description}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {collective.membersCount} {collective.membersCount === 1 ? "member" : "members"}
              </span>
              <span>{collective.postsCount} posts</span>
              <span>
                Created {formatDistanceToNow(new Date(collective.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <JoinButton
              collectiveId={collective.id}
              collectiveSlug={slug}
              joinType={collective.joinType}
              viewerMembership={collective.viewerMembership}
              creatorId={collective.creatorId}
            />
            {canManageCollective && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-lg"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "posts" && (
          <div>
            {canPost && (
              <div className="p-4 border-b border-border">
                <Button
                  onClick={() => setPostModalOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  Create a post
                </Button>
              </div>
            )}
            <CollectivePostsFeed collectiveId={collective.id} />
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="p-4">
            <CollectivePortfolioGrid
              collectiveId={collective.id}
              collectiveSlug={slug}
              canEditPortfolio={!!canEditPortfolio}
            />
          </div>
        )}

        {activeTab === "members" && (
          <CollectiveMembersList
            collectiveId={collective.id}
            collectiveSlug={slug}
            viewerPermissions={viewerPerms || null}
          />
        )}
      </div>

      {/* Create Post Modal */}
      {canPost && (
        <CreateCollectivePostModal
          open={postModalOpen}
          onOpenChange={setPostModalOpen}
          collectiveId={collective.id}
          collectiveSlug={slug}
        />
      )}

      {/* Settings Modal */}
      {canManageCollective && (
        <CollectiveSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          collectiveId={collective.id}
          collectiveSlug={slug}
          creatorId={collective.creatorId}
          userId={user?.id}
        />
      )}
    </div>
  );
}
