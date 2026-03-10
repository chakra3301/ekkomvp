import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@ekko/api";
import { prisma, UserRole } from "@ekko/database";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const handler = async (req: Request) => {
  try {
    let supabaseUser = null;

    // Try cookie-based auth first (standard SSR flow)
    const supabase = createClient();
    const { data: cookieAuth, error: cookieError } = await supabase.auth.getUser();
    supabaseUser = cookieAuth.user;
    console.log("[tRPC handler] Cookie auth:", !!supabaseUser, "error:", cookieError?.message || "none");

    // Fallback: read Bearer token from Authorization header (native iOS)
    if (!supabaseUser) {
      const authHeader = req.headers.get("Authorization");
      console.log("[tRPC handler] Auth header present:", !!authHeader, authHeader ? authHeader.slice(0, 20) + "..." : "none");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: tokenAuth, error: tokenError } = await supabaseAdmin.auth.getUser(token);
        supabaseUser = tokenAuth.user;
        console.log("[tRPC handler] Token auth:", !!supabaseUser, "error:", tokenError?.message || "none");
      }
    }

    let dbUser = null;
    if (supabaseUser) {
      const metadata = supabaseUser.user_metadata || {};
      const email =
        supabaseUser.email ||
        metadata.email ||
        `${supabaseUser.id}@placeholder.local`;

      // 1. Try to find by Supabase ID first
      dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      });

      // 2. If not found, try by email (handles re-registration or different OAuth provider)
      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { email },
        });
      }

      // 3. If still not found, create new user
      if (!dbUser) {
        try {
          dbUser = await prisma.user.create({
            data: {
              id: supabaseUser.id,
              email,
              role: UserRole.CREATIVE,
              emailVerified: !!supabaseUser.email_confirmed_at,
              phone: metadata.phone || null,
              dateOfBirth: metadata.date_of_birth
                ? new Date(metadata.date_of_birth)
                : null,
            },
          });
        } catch (e) {
          console.error("[tRPC handler] User create failed:", e);
          // Last resort: try email lookup again (race condition)
          dbUser = await prisma.user.findUnique({
            where: { email },
          });
        }
      }
    }

    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: () => createContext(dbUser),
      onError({ error, path }) {
        console.error(`tRPC Error on '${path}':`, error);
      },
    });
  } catch (e) {
    console.error("[tRPC handler] Unhandled error:", e);
    return new Response(
      JSON.stringify([{ error: { message: "Internal server error" } }]),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export { handler as GET, handler as POST };
