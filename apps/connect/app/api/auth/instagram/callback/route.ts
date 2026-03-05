import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ekko/database";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  const origin = new URL(request.url).origin;

  if (error || !code || !state) {
    return NextResponse.redirect(`${origin}/settings?ig=error`);
  }

  // Decode state to get user ID
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    userId = decoded.userId;
    if (!userId) throw new Error("Missing userId");
  } catch {
    return NextResponse.redirect(`${origin}/settings?ig=error`);
  }

  const clientId = process.env.INSTAGRAM_APP_ID!;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET!;
  const redirectUri = `${origin}/api/auth/instagram/callback`;

  try {
    // Step 1: Exchange authorization code for short-lived token
    const tokenRes = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      console.error("[Instagram] Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/settings?ig=error`);
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;
    const igUserId = String(tokenData.user_id);

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    );

    if (!longRes.ok) {
      console.error("[Instagram] Long-lived token failed:", await longRes.text());
      return NextResponse.redirect(`${origin}/settings?ig=error`);
    }

    const longData = await longRes.json();
    const longLivedToken = longData.access_token;
    const expiresIn = longData.expires_in; // seconds (5184000 = 60 days)

    // Step 3: Fetch Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${longLivedToken}`
    );
    const profileData = profileRes.ok ? await profileRes.json() : null;
    const igUsername = profileData?.username || null;

    // Step 4: Store token + username in database
    const expiry = new Date(Date.now() + expiresIn * 1000);

    await prisma.connectProfile.update({
      where: { userId },
      data: {
        instagramAccessToken: longLivedToken,
        instagramTokenExpiry: expiry,
        instagramUserId: igUserId,
        ...(igUsername ? { instagramHandle: igUsername } : {}),
      },
    });

    return NextResponse.redirect(`${origin}/settings?ig=connected`);
  } catch (err) {
    console.error("[Instagram] OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/settings?ig=error`);
  }
}
