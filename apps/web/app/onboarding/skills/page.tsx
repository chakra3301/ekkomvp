import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSkillsForm } from "@/components/onboarding/skills-form";

export const metadata: Metadata = {
  title: "Select Your Skills",
  description: "Choose your skills and disciplines to showcase your expertise",
};

export default async function OnboardingSkillsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <OnboardingSkillsForm />;
}
