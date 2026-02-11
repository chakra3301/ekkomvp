import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileAccentScope } from "@/components/profile/profile-accent-scope";
import { ProfileBackground } from "@/components/profile/profile-background";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await prisma.profile.findUnique({
    where: { username },
    select: { displayName: true, headline: true },
  });

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  return {
    title: profile.displayName,
    description: profile.headline || `${profile.displayName}'s profile on EKKO`,
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const profile = await prisma.profile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          createdAt: true,
        },
      },
      skills: {
        include: {
          skill: true,
        },
      },
      disciplines: {
        include: {
          discipline: true,
        },
      },
    },
  });

  if (!profile) {
    notFound();
  }

  // Check if this is the current user's profile
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.user.id;

  const postCount = await prisma.post.count({
    where: { userId: profile.user.id },
  });

  return (
    <ProfileAccentScope accentColor={profile.accentColor}>
      <ProfileBackground background={profile.pageBackground as { type: "solid" | "gradient" | "image"; value: string } | null}>
        <div>
          {/* Sticky Header */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
            <div className="flex items-center gap-6 px-4 py-2">
              <Link
                href="/feed"
                className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">{profile.displayName}</h1>
                <p className="text-sm text-muted-foreground">
                  {postCount} {postCount === 1 ? "post" : "posts"}
                </p>
              </div>
            </div>
          </header>

          {/* Profile Content */}
          <ProfileHeader profile={profile as any} isOwnProfile={isOwnProfile} />
        </div>
      </ProfileBackground>
    </ProfileAccentScope>
  );
}
