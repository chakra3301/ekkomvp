import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { FeedPage } from "@/components/feed/feed-page";

export const metadata: Metadata = {
  title: "Feed",
  description: "See what creatives are sharing on EKKO",
};

export default async function FeedRoute() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <FeedPage />;
}
