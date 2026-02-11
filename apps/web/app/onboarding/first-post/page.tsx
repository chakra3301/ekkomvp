import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FirstPostForm } from "@/components/onboarding/first-post-form";

export const metadata: Metadata = {
  title: "Create Your First Post",
  description: "Share something with the EKKO community",
};

export default async function OnboardingFirstPostPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <FirstPostForm userId={user.id} />;
}
