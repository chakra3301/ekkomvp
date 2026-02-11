import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, UserRole } from "@ekko/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const role = searchParams.get("role") as UserRole | null;

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user exists in our database
      let dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
      });

      // If not, create the user
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: data.user.id,
            email: data.user.email!,
            role: role || UserRole.CREATIVE,
            emailVerified: !!data.user.email_confirmed_at,
          },
        });

        // Redirect new users to onboarding
        return NextResponse.redirect(`${origin}/onboarding/profile`);
      }

      // Check if user has completed onboarding
      if (!dbUser.onboarded) {
        return NextResponse.redirect(`${origin}/onboarding/profile`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
