"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { format } from "date-fns";
import {
  MapPin,
  Globe,
  Calendar,
  BadgeCheck,
  Instagram,
  Briefcase,
  MoreHorizontal,
  Flag,
  Ban,
  Crown,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid";
import { EditProfileModal } from "@/components/profile/edit-profile-modal";
import { ProfilePosts } from "@/components/profile/profile-posts";
import { LikedPosts } from "@/components/profile/liked-posts";
import { FollowButton } from "@/components/follow/follow-button";
import { CreateGigModal } from "@/components/gigs/create-gig-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { ReportDialog } from "@/components/report/report-dialog";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";

type ProfileTab = "posts" | "portfolio" | "likes";

interface ProfileHeaderProps {
  profile: {
    id?: string;
    username: string;
    displayName: string;
    headline?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    location?: string | null;
    website?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    tiktokUrl?: string | null;
    availability?: string | null;
    verificationStatus?: string | null;
    hourlyRateMin?: number | null;
    hourlyRateMax?: number | null;
    disciplines?: Array<{
      isPrimary: boolean;
      discipline: {
        name: string;
        slug: string;
      };
    }>;
    skills?: Array<{
      proficiency: number;
      skill: {
        name: string;
      };
    }>;
    followersCount?: number;
    followingCount?: number;
    subscriptionTier?: string | null;
    accentColor?: string | null;
    pageBackground?: { type: "solid" | "gradient" | "image"; value: string } | null;
    user: {
      id: string;
      role: string;
      createdAt: Date;
    };
  };
  isOwnProfile?: boolean;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvailabilityBadge = (status: string | null) => {
  switch (status) {
    case "AVAILABLE":
      return { text: "Available", className: "bg-green-500/10 text-green-600 border-green-500/20" };
    case "BUSY":
      return { text: "Busy", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
    default:
      return null;
  }
};

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const router = useRouter();
  const { profile: currentUserProfile } = useProfile();
  const { promptLogin } = useLoginPrompt();
  const primaryDiscipline = profile.disciplines?.find((d) => d.isPrimary);
  const availabilityBadge = getAvailabilityBadge(profile.availability ?? null);
  const isCurrentUserClient = currentUserProfile?.user?.role === "CLIENT";
  const isViewingCreative = profile.user.role === "CREATIVE";
  const showRequestButton = !isOwnProfile && isCurrentUserClient && isViewingCreative;

  const getOrCreateConversation = trpc.message.getOrCreateConversation.useMutation({
    onSuccess: (conversation) => {
      router.push(`/messages?conversation=${conversation.id}`);
    },
  });

  // Track profile view for non-own profiles
  const trackProfileView = trpc.analytics.trackProfileView.useMutation();
  const viewTracked = useRef(false);
  useEffect(() => {
    if (!isOwnProfile && profile.id && !viewTracked.current) {
      viewTracked.current = true;
      trackProfileView.mutate(profile.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnProfile, profile.id]);

  const utils = trpc.useUtils();
  const { data: blockData } = trpc.block.isBlocked.useQuery(profile.user.id, {
    enabled: !isOwnProfile && !!currentUserProfile,
  });

  const blockMutation = trpc.block.block.useMutation({
    onSuccess: () => {
      utils.block.isBlocked.invalidate(profile.user.id);
      toast.success(`Blocked @${profile.username}`);
    },
  });

  const unblockMutation = trpc.block.unblock.useMutation({
    onSuccess: () => {
      utils.block.isBlocked.invalidate(profile.user.id);
      toast.success(`Unblocked @${profile.username}`);
    },
  });

  return (
    <div>
      {/* Banner — liquid glass frame */}
      <div className="relative h-32 sm:h-48 mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
          />
        )}
        <div className="glass-banner-overlay" />
      </div>

      {/* Profile Info - semi-transparent glass panel (matches discipline/skill buttons) */}
      <div className="relative px-4 pb-4">
        {/* Avatar and Edit Button Row */}
        <div className="flex justify-between items-start">
          {/* Avatar — liquid glass ring */}
          <div className="relative -mt-16 sm:-mt-20 glass-avatar-ring">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary text-primary-foreground">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="rounded-lg font-bold"
                onClick={() => setEditModalOpen(true)}
              >
                Edit profile
              </Button>
            ) : (
              <>
                {showRequestButton && (
                  <Button
                    variant="outline"
                    className="rounded-lg font-bold"
                    onClick={() => setRequestModalOpen(true)}
                  >
                    <Briefcase className="h-4 w-4 mr-1" />
                    Hire
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-lg font-bold"
                  onClick={() => {
                    if (!currentUserProfile) {
                      promptLogin("Sign in to send a message.");
                    } else {
                      getOrCreateConversation.mutate(profile.user.id);
                    }
                  }}
                  disabled={getOrCreateConversation.isPending}
                >
                  Message
                </Button>
                <FollowButton userId={profile.user.id} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report user
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (blockData?.blockedByMe) {
                          unblockMutation.mutate(profile.user.id);
                        } else {
                          blockMutation.mutate(profile.user.id);
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      {blockData?.blockedByMe ? "Unblock user" : "Block user"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isOwnProfile && (
          <EditProfileModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            profile={profile}
            userRole={profile.user.role}
          />
        )}

        {/* Send Work Request Modal */}
        {showRequestButton && (
          <CreateGigModal
            open={requestModalOpen}
            onOpenChange={setRequestModalOpen}
            isDirect
            targetCreativeId={profile.user.id}
            targetCreativeName={profile.displayName}
          />
        )}

        {/* Report Dialog */}
        {!isOwnProfile && (
          <ReportDialog
            targetType="USER"
            targetId={profile.user.id}
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
          />
        )}

        {/* Info panel — liquid glass card */}
        <div className="mt-3 glass-card p-4">
          {/* Name and Username */}
          <div>
            <div className="flex items-center gap-1 flex-wrap">
              <h2 className="text-xl font-bold">{profile.displayName}</h2>
              {profile.verificationStatus === "VERIFIED" && (
                <BadgeCheck className="h-5 w-5 text-accent" />
              )}
              {(profile.subscriptionTier === "PRO" || profile.subscriptionTier === "BUSINESS") && (
                <Badge variant="outline" className="ml-1 text-xs border-primary/30 text-primary gap-1 py-0">
                  <Crown className="h-3 w-3" />
                  {profile.subscriptionTier === "BUSINESS" ? "Business" : "Pro"}
                </Badge>
              )}
              {availabilityBadge && (
                <Badge variant="outline" className={cn("ml-2 text-xs", availabilityBadge.className)}>
                  {availabilityBadge.text}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Headline */}
          {profile.headline && (
            <p className="mt-2 font-medium">{profile.headline}</p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 whitespace-pre-line">{profile.bio}</p>
          )}

          {/* Meta Info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {primaryDiscipline && (
              <span className="text-foreground font-medium">
                {primaryDiscipline.discipline.name}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent hover:underline"
              >
                <Globe className="h-4 w-4" />
                {new URL(profile.website).hostname}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {format(new Date(profile.user.createdAt), "MMMM yyyy")}
            </span>
          </div>

          {/* Social Links */}
          {(profile.instagramUrl || profile.twitterUrl || profile.tiktokUrl) && (
            <div className="mt-3 flex items-center gap-3">
              {profile.instagramUrl && (
                <a
                  href={profile.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {profile.twitterUrl && (
                <a
                  href={profile.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              )}
              {profile.tiktokUrl && (
                <a
                  href={profile.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.2 8.2 0 0 0 4.76 1.52V7.05a4.84 4.84 0 0 1-1-.36z" />
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Rate */}
          {profile.user.role === "CREATIVE" &&
            (profile.hourlyRateMin || profile.hourlyRateMax) && (
              <p className="mt-3 text-sm">
                <span className="font-bold">
                  ${profile.hourlyRateMin || 0}
                  {profile.hourlyRateMax && ` - $${profile.hourlyRateMax}`}
                </span>
                <span className="text-muted-foreground">/hour</span>
              </p>
            )}

          {/* Follow Stats */}
          <div className="mt-3 flex gap-4 text-sm">
            <span>
              <span className="font-bold">{profile.followingCount ?? 0}</span>{" "}
              <span className="text-muted-foreground">Following</span>
            </span>
            <span>
              <span className="font-bold">{profile.followersCount ?? 0}</span>{" "}
              <span className="text-muted-foreground">Followers</span>
            </span>
          </div>
        </div>

        {/* Disciplines */}
        {profile.disciplines && profile.disciplines.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {profile.disciplines.map((d) => (
                <Badge
                  key={d.discipline.slug}
                  variant={d.isPrimary ? "glass-primary" : "glass"}
                  className="rounded-lg"
                >
                  {d.discipline.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <Badge key={s.skill.name} variant="glass" className="rounded-lg">
                  {s.skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs - semi-transparent glass */}
      <div className="rounded-t-lg mx-4 mt-4 overflow-hidden bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-b-0 border-white/30 dark:border-white/10">
        <div className="flex border-b border-white/20 dark:border-white/10">
          <button
            onClick={() => setActiveTab("posts")}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-all",
              activeTab === "posts"
                ? "font-bold border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:bg-white/30 dark:hover:bg-white/10"
            )}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-all",
              activeTab === "portfolio"
                ? "font-bold border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:bg-white/30 dark:hover:bg-white/10"
            )}
          >
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-all",
              activeTab === "likes"
                ? "font-bold border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:bg-white/30 dark:hover:bg-white/10"
            )}
          >
            Likes
          </button>
        </div>

        {/* Tab Content - same glass panel */}
        {activeTab === "posts" && (
          <div className="px-4 py-4 min-h-[200px]">
            <ProfilePosts userId={profile.user.id} />
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="min-h-[200px]">
            <PortfolioGrid username={profile.username} isOwnProfile={isOwnProfile} />
          </div>
        )}

        {activeTab === "likes" && (
          <div className="px-4 py-4 min-h-[200px]">
            <LikedPosts userId={profile.user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
