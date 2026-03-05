import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma, UserRole } from "@ekko/database";

/**
 * Ensures a DB user record exists for the authenticated Supabase user.
 * Called after native sign-in (Apple/Google signInWithIdToken) where
 * the standard /api/auth/callback isn't used.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { connectProfile: { select: { id: true } } },
  });

  if (!dbUser) {
    const metadata = user.user_metadata || {};

    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
        role: UserRole.CREATIVE,
        emailVerified: !!user.email_confirmed_at,
        phone: metadata.phone || null,
        dateOfBirth: metadata.date_of_birth
          ? new Date(metadata.date_of_birth)
          : null,
      },
      include: { connectProfile: { select: { id: true } } },
    });
  }

  const hasDateOfBirth = !!dbUser.dateOfBirth;
  const hasConnectProfile = !!dbUser.connectProfile;

  let redirect = "/discover";
  if (!hasDateOfBirth) redirect = "/complete-profile";
  else if (!hasConnectProfile) redirect = "/profile/setup";

  return NextResponse.json({ redirect });
}
