import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@ekko/api";
import { prisma, UserRole } from "@ekko/database";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const handler = async (req: Request) => {
  try {
    let supabaseUser = null;
    const url = new URL(req.url);
    const procedure = url.pathname.split("/api/trpc/")[1]?.split("?")[0] || "unknown";

    // Try cookie-based auth first (standard SSR flow)
    const supabase = createClient();
    const { data: cookieAuth } = await supabase.auth.getUser();
    supabaseUser = cookieAuth.user;

    // Fallback: read Bearer token from Authorization header (native iOS)
    if (!supabaseUser) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);

        // Sanity check env vars on first request
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error(`[tRPC/${procedure}] Missing env vars: SUPABASE_URL=${!!process.env.NEXT_PUBLIC_SUPABASE_URL} ANON_KEY=${!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`);
        }

        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: tokenAuth, error: tokenErr } = await supabaseAdmin.auth.getUser(token);
        if (tokenErr) {
          console.error(`[tRPC/${procedure}] Bearer token rejected by Supabase: ${tokenErr.message}. Token prefix: ${token.slice(0, 30)}...`);
        } else if (!tokenAuth.user) {
          console.error(`[tRPC/${procedure}] Bearer token returned no user. Token prefix: ${token.slice(0, 30)}...`);
        } else {
          console.log(`[tRPC/${procedure}] Bearer auth OK for ${tokenAuth.user.email} (${tokenAuth.user.id})`);
        }
        supabaseUser = tokenAuth.user;
      } else {
        console.log(`[tRPC/${procedure}] No cookie auth, no Authorization header`);
      }
    } else {
      console.log(`[tRPC/${procedure}] Cookie auth OK for ${supabaseUser.email}`);
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
          console.log(`[tRPC] Auto-created user ${dbUser.id} (${dbUser.email})`);
        } catch (e: any) {
          console.error(`[tRPC] Failed to auto-create user for supabase id ${supabaseUser.id} (${email}):`, e?.message || e);

          // Email conflict: an orphaned Prisma row exists with a stale Supabase ID.
          // Most common cause: the user was deleted in the Supabase dashboard without
          // going through the app's delete endpoint, so the Prisma row never cascaded.
          // Clean up the orphan and its related data, then create fresh.
          if (e?.code === "P2002") {
            try {
              console.log(`[tRPC] Email conflict — deleting orphan DB row for ${email} and all related data`);
              // Cascade delete via Prisma schema relations
              await prisma.user.deleteMany({ where: { email } });

              // Now create fresh
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
              console.log(`[tRPC] Re-created user ${dbUser.id} after clearing orphan`);
            } catch (cleanupErr: any) {
              console.error(`[tRPC] Orphan cleanup failed:`, cleanupErr?.message || cleanupErr);
              dbUser = null;
            }
          } else {
            dbUser = null;
          }
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
