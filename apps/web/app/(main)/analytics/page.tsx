import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Your EKKO analytics dashboard",
};

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AnalyticsDashboard />;
}
