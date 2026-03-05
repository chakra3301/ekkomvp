import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.INSTAGRAM_APP_ID;
  if (!clientId) {
    return new NextResponse("Instagram App ID not configured", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  // Encode user ID in state for verification in callback
  const state = Buffer.from(
    JSON.stringify({ userId: user.id, ts: Date.now() })
  ).toString("base64url");

  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "instagram_business_basic");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
