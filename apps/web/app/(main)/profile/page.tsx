import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileAccentScope } from "@/components/profile/profile-accent-scope";
import { ProfileBackground } from "@/components/profile/profile-background";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your EKKO profile",
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
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
    redirect("/onboarding/profile");
  }

  const postCount = await prisma.post.count({
    where: { userId: profile.user.id },
  });

  return (
    <ProfileAccentScope accentColor={profile.accentColor}>
      <ProfileBackground background={profile.pageBackground as { type: "solid" | "gradient" | "image"; value: string } | null}>
        <div>
          {/* Sticky Header */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
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
          <ProfileHeader profile={profile as any} isOwnProfile />
        </div>
      </ProfileBackground>
    </ProfileAccentScope>
  );
}
