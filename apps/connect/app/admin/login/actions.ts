"use server";

import { prisma } from "@ekko/database";

import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Result = { ok: true } | { ok: false; error: string };

async function isAdminEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// Step 1 — send a 6-digit OTP, but ONLY to a known admin account.
// `shouldCreateUser: false` guarantees we never mint a new account here, and the
// role pre-check means a random visitor can't even trigger a code being sent.
export async function requestAdminOtp(rawEmail: string): Promise<Result> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!(await isAdminEmail(email))) {
    return { ok: false, error: "This email isn't authorized for admin access." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// Step 2 — verify the code (this sets the session cookie via the SSR client),
// then re-confirm the now-authenticated user is actually an admin. If not, sign
// them back out immediately so a non-admin session can never linger.
export async function verifyAdminOtp(
  rawEmail: string,
  token: string
): Promise<Result> {
  const email = rawEmail.trim().toLowerCase();
  const code = token.replace(/\s/g, "");
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (code.length < 6) {
    return { ok: false, error: "Enter the 6-digit code." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "That code is invalid or expired." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "ADMIN") {
    await supabase.auth.signOut();
    return { ok: false, error: "This account isn't authorized for admin access." };
  }

  return { ok: true };
}
