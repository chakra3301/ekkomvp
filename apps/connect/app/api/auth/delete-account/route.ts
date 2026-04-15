import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";

export async function POST(req: Request) {
  // Try cookie-based auth first (web), fall back to Bearer token (native iOS)
  let user = null;

  const supabase = createClient();
  const cookieAuth = await supabase.auth.getUser();
  user = cookieAuth.data.user;

  if (!user) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await admin.auth.getUser(token);
      user = data.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = user.id;
  const email = user.email;

  console.log(`[delete-account] Deleting user ${userId} (${email})`);

  // 1. Delete all user data from Prisma (cascades all relations)
  try {
    await prisma.user.delete({ where: { id: userId } });
    console.log(`[delete-account] Prisma user ${userId} deleted`);
  } catch (e: any) {
    console.log(`[delete-account] Prisma user ${userId} not found or already deleted:`, e?.message);
  }

  // Also clean up any orphaned Prisma row with the same email but a *different* id.
  // Scoped with `id: { not: userId }` so we never race with a concurrent signup
  // that now owns this email under a fresh Supabase id.
  if (email) {
    try {
      const { count } = await prisma.user.deleteMany({
        where: { email, id: { not: userId } },
      });
      if (count > 0) {
        console.log(`[delete-account] Removed ${count} orphan row(s) for ${email}`);
      }
    } catch (e: any) {
      console.log(`[delete-account] Email cleanup skipped:`, e?.message);
    }
  }

  // 2. Delete the Supabase auth user via service role
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    console.error(`[delete-account] SUPABASE_SERVICE_ROLE_KEY not set — auth user NOT deleted`);
    return NextResponse.json(
      { error: "Server not configured (missing service role key)" },
      { status: 500 }
    );
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRole,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error(`[delete-account] Supabase auth delete failed:`, deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  console.log(`[delete-account] Supabase auth user ${userId} deleted`);
  return NextResponse.json({ success: true });
}
