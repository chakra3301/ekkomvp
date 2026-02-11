import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { MessagesView } from "@/components/messages/messages-view";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your conversations on EKKO",
};

export default async function MessagesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MessagesView currentUserId={user.id} />;
}
