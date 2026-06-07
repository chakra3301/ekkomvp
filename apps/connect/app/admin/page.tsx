import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@ekko/database";

import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "EKKO admin moderation dashboard",
};

// Admin dashboard. Authenticated admins only. Unauthenticated visitors are sent
// to the web admin login (/admin/login, email + OTP, admin-only). A signed-in
// but non-admin user is bounced to the landing page.
export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminDashboard />;
}
