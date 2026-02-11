import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { WorkOrdersDashboard } from "@/components/work-orders/work-orders-dashboard";

export const metadata: Metadata = {
  title: "Work Orders",
  description: "Manage your work orders on EKKO",
};

export default async function WorkOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <WorkOrdersDashboard />;
}
