import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, UserRole } from "@ekko/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/discover";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Find by Supabase ID first, then by email (handles re-registration / different OAuth provider)
      let dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        include: { connectProfile: { select: { id: true } } },
      });

      if (!dbUser && data.user.email) {
        dbUser = await prisma.user.findUnique({
          where: { email: data.user.email },
          include: { connectProfile: { select: { id: true } } },
        });
      }

      if (!dbUser) {
        // New user — create account in DB
        const metadata = data.user.user_metadata || {};

        try {
          dbUser = await prisma.user.create({
            data: {
              id: data.user.id,
              email: data.user.email!,
              role: UserRole.CREATIVE,
              emailVerified: !!data.user.email_confirmed_at,
              phone: metadata.phone || null,
              dateOfBirth: metadata.date_of_birth
                ? new Date(metadata.date_of_birth)
                : null,
            },
            include: { connectProfile: { select: { id: true } } },
          });
        } catch (e) {
          // Email conflict — find existing user
          dbUser = await prisma.user.findUnique({
            where: { email: data.user.email! },
            include: { connectProfile: { select: { id: true } } },
          });
        }

        if (!dbUser) {
          return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
        }

        // OAuth signups won't have DOB in metadata — send to complete-profile
        const metadata2 = data.user.user_metadata || {};
        const hasCompletedInfo = !!metadata2.date_of_birth;
        if (!hasCompletedInfo) {
          return NextResponse.redirect(`${origin}/complete-profile`);
        }

        // Email signup with full metadata — go to Connect profile setup
        return NextResponse.redirect(`${origin}/profile/setup`);
      }

      // Existing user — check for ConnectProfile
      if (!dbUser.connectProfile) {
        return NextResponse.redirect(`${origin}/profile/setup`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
