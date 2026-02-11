import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { BookmarksPage } from "@/components/bookmarks/bookmarks-page";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved posts on EKKO",
};

export default async function Bookmarks() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <BookmarksPage />;
}
