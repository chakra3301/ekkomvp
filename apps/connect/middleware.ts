import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = [
  "/discover",
  "/profile",
  "/matches",
  "/likes",
  "/settings",
  "/browse",
];

const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users on auth pages → send to discover
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/discover";
    return NextResponse.redirect(url);
  }

  // Authenticated users on root → send to discover
  if (pathname === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/discover";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
