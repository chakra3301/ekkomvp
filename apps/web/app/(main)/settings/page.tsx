import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "@/components/settings/settings-page";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your EKKO account settings",
};

export default async function Settings() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SettingsPage userEmail={user.email || ""} />;
}
