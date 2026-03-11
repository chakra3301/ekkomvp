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
    const { data: cookieAuth } = await supabase.auth.getUser();
    supabaseUser = cookieAuth.user;

    // Fallback: read Bearer token from Authorization header (native iOS)
    if (!supabaseUser) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: tokenAuth } = await supabaseAdmin.auth.getUser(token);
        supabaseUser = tokenAuth.user;
      }
    }

    let dbUser = null;
    if (supabaseUser) {
      // Look up by Supabase ID only — account linking is handled in the auth callback
      dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      });

      // Auto-create if the auth callback didn't create the user yet
      if (!dbUser) {
        const metadata = supabaseUser.user_metadata || {};
        const email =
          supabaseUser.email ||
          metadata.email ||
          `${supabaseUser.id}@placeholder.local`;

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
        } catch {
          // Email conflict — user exists with different ID.
          // They need to go through the auth callback to link accounts.
          dbUser = null;
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
