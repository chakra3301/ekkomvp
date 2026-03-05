import { NextResponse } from "next/server";

/**
 * Native OAuth redirect handler.
 *
 * After OAuth completes in SFSafariViewController, Supabase redirects here
 * with a ?code= param. We return a minimal HTML page that forwards the code
 * to the app via the `ekkoconnect://` custom URL scheme. The Capacitor
 * appUrlOpen listener catches it and navigates the WebView to the standard
 * /api/auth/callback, where the PKCE verifier cookie is available for the
 * code exchange.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/discover";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  const deepLink = `ekkoconnect://auth-callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting…</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#0f0f0f;color:#fff;">
<p id="msg">Redirecting to EKKO Connect…</p>
<script>
window.location.href = ${JSON.stringify(deepLink)};
setTimeout(function(){document.getElementById("msg").textContent="If the app didn\\'t open, please go back and try again.";},3000);
</script>
</body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
