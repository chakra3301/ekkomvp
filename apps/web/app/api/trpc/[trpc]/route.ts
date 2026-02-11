import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@ekko/api";
import { prisma } from "@ekko/database";
import { createClient } from "@/lib/supabase/server";

const handler = async (req: Request) => {
  // Get the authenticated user from Supabase
  const supabase = createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  // Get the database user if authenticated
  let dbUser = null;
  if (supabaseUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });
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
