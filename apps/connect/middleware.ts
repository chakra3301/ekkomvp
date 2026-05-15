import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// apps/connect is the public surface (landing, /apply, /invite, /admin)
// + the API backend for the native iOS app. There is no longer any
// in-browser app UI to gate — the (main) and (auth) route groups were
// removed when the native iOS app replaced the Capacitor web shell.
//
// We still call updateSession so the admin route's tRPC calls can read
// the Supabase cookie. /admin enforces ADMIN role inside the procedure
// (see packages/api/src/trpc.ts), so route-level gating isn't needed.
export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
