import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@ekko/api";
import { prisma, UserRole } from "@ekko/database";
import { createClient } from "@/lib/supabase/server";

const handler = async (req: Request) => {
  try {
    const supabase = createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    let dbUser = null;
    if (supabaseUser) {
      const metadata = supabaseUser.user_metadata || {};
      const email =
        supabaseUser.email ||
        metadata.email ||
        `${supabaseUser.id}@placeholder.local`;

      // Upsert to handle race conditions with concurrent requests
      try {
        dbUser = await prisma.user.upsert({
          where: { id: supabaseUser.id },
          update: {},
          create: {
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
        console.error("[tRPC handler] User upsert failed:", e);
        // Fall back to just finding the user
        dbUser = await prisma.user.findUnique({
          where: { id: supabaseUser.id },
        });
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
