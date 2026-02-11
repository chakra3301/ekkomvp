import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@ekko/database";

import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "EKKO admin moderation dashboard",
};

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin role
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "ADMIN") {
    redirect("/feed");
  }

  return <AdminDashboard />;
}
