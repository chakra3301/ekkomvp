import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1. Delete all user data from Prisma (cascades all relations)
  await prisma.user.delete({ where: { id: user.id } }).catch(() => {
    // User may not exist in Prisma yet (e.g. incomplete signup)
  });

  // 2. Delete the Supabase auth user via service role
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRole) {
    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRole,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await admin.auth.admin.deleteUser(user.id);
  }

  return NextResponse.json({ success: true });
}
