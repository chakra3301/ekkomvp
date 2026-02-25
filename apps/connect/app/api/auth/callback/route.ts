import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Verify the user exists in our database
      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        include: { connectProfile: { select: { id: true } } },
      });

      if (!dbUser) {
        // User doesn't exist in DB — redirect to main EKKO to complete signup first
        return NextResponse.redirect(`${origin}/login?error=no_account`);
      }

      // If no Connect profile, send to setup
      if (!dbUser.connectProfile) {
        return NextResponse.redirect(`${origin}/profile/setup`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
