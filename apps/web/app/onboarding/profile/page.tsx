import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProfileForm } from "@/components/onboarding/profile-form";

export const metadata: Metadata = {
  title: "Complete Your Profile",
  description: "Tell us about yourself to get started on EKKO",
};

export default async function OnboardingProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user role from metadata
  const role = user.user_metadata?.role || "CREATIVE";

  return <OnboardingProfileForm userId={user.id} userRole={role} />;
}
