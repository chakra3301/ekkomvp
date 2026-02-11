import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update your EKKO profile",
};

export default async function ProfileEditPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
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

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-6 px-4 py-3">
          <Link
            href="/profile"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Edit profile</h1>
        </div>
      </header>

      {/* Form Content */}
      <div className="px-4 py-4">
        <ProfileEditForm
          profile={profile}
          userRole={dbUser?.role || "CREATIVE"}
        />
      </div>
    </div>
  );
}
