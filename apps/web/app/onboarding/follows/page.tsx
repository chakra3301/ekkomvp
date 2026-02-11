import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SuggestedFollows } from "@/components/onboarding/suggested-follows";

export const metadata: Metadata = {
  title: "Follow Creatives",
  description: "Follow some creatives to get started on EKKO",
};

export default async function OnboardingFollowsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = user.user_metadata?.role || "CREATIVE";

  return <SuggestedFollows userRole={userRole} />;
}
