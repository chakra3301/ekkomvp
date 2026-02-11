import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your notifications on EKKO",
};

export default async function NotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </header>

      <NotificationsList />
    </div>
  );
}
