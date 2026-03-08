import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@ekko/api";
import { prisma, UserRole } from "@ekko/database";
import { createClient } from "@/lib/supabase/server";

const handler = async (req: Request) => {
  const supabase = createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (supabaseUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });

    // Auto-create DB user if Supabase auth user exists but DB record doesn't
    if (!dbUser) {
      const metadata = supabaseUser.user_metadata || {};
      dbUser = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          role: UserRole.CREATIVE,
          emailVerified: !!supabaseUser.email_confirmed_at,
          phone: metadata.phone || null,
          dateOfBirth: metadata.date_of_birth
            ? new Date(metadata.date_of_birth)
            : null,
        },
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
};

export { handler as GET, handler as POST };
