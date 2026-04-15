import { NextResponse } from "next/server";

/**
 * Apple App Site Association file for Universal Links.
 * Served from https://ekkoconnect.app/.well-known/apple-app-site-association
 *
 * Apple requires Content-Type: application/json (no .json extension in the URL).
 * Update YOUR_TEAM_ID with your Apple Developer Team ID (found at the top-right
 * of https://developer.apple.com/account, or in Xcode → Signing & Capabilities).
 */
export async function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${process.env.APPLE_TEAM_ID || "YOUR_TEAM_ID"}.app.ekkoconnect.connect`,
            paths: [
              "/matches/*",
              "/likes",
              "/discover",
              "/profile/*",
              "/auth-callback",
            ],
          },
        ],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
