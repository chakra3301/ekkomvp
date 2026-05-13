import { Resend } from "resend";

// Lazy-init so the SDK isn't constructed at import time on Edge runtimes
// that may not have RESEND_API_KEY set during build.
let _resend: Resend | null = null;
function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.RESEND_FROM ?? "EKKO <hello@ekkoconnect.app>";
const APP_STORE_URL = "https://apps.apple.com/ca/app/ekko/id6759824029";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type SendResult = { ok: true; id: string } | { ok: false; error: string };

// Single chokepoint for outbound transactional mail. Never throws — callers
// decide whether to surface failures or fail silently.
export async function sendTransactionalEmail(args: SendArgs): Promise<SendResult> {
  const c = client();
  if (!c) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { data, error } = await c.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) return { ok: false, error: error.message ?? "Send failed" };
    if (!data?.id) return { ok: false, error: "No id returned" };
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

// ─── Templates ───────────────────────────────────────────────────────────
//
// HTML is intentionally minimal — system fonts, brand black/white, single
// CTA. Easier to render reliably across Gmail/iOS Mail/Outlook than a
// full templated layout.

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EKKO</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5f5f5;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
<tr><td style="padding-bottom:32px;">
<div style="font-size:24px;font-weight:700;letter-spacing:2px;">EKKO</div>
</td></tr>
${bodyHtml}
<tr><td style="padding-top:48px;border-top:1px solid #1f1f1f;color:#7a7a7a;font-size:12px;line-height:18px;">
EKKO is invite-only by design. This email was sent because you applied at ekkoconnect.app/apply.
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function applicationApprovedTemplate(): { subject: string; html: string; text: string } {
  const subject = "You're in — welcome to EKKO.";
  const html = shell(`
<tr><td style="font-size:32px;font-weight:700;line-height:1.2;padding-bottom:16px;">You're in.</td></tr>
<tr><td style="font-size:16px;line-height:1.6;color:#cfcfcf;padding-bottom:32px;">
Your application's approved. EKKO is invite-only — sign in with this email address to claim your spot.
</td></tr>
<tr><td style="padding-bottom:24px;">
<a href="${APP_STORE_URL}" style="display:inline-block;background:#ffffff;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:12px;">Get EKKO on the App Store</a>
</td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#7a7a7a;">
Already have the app? Just sign in with this email and you'll land straight in.
</td></tr>`);
  const text = `You're in.

Your application's approved. EKKO is invite-only — sign in with this email address to claim your spot.

Get EKKO on the App Store: ${APP_STORE_URL}

Already have the app? Just sign in with this email and you'll land straight in.`;
  return { subject, html, text };
}

export function applicationWaitlistedTemplate(): { subject: string; html: string; text: string } {
  const subject = "Thanks for applying to EKKO";
  const html = shell(`
<tr><td style="font-size:32px;font-weight:700;line-height:1.2;padding-bottom:16px;">Thanks for applying.</td></tr>
<tr><td style="font-size:16px;line-height:1.6;color:#cfcfcf;padding-bottom:16px;">
EKKO is in its early invite-only phase, and we can't accept every application right now.
</td></tr>
<tr><td style="font-size:16px;line-height:1.6;color:#cfcfcf;">
We'll review your work again in 60 days. If our take changes, we'll be in touch.
</td></tr>`);
  const text = `Thanks for applying.

EKKO is in its early invite-only phase, and we can't accept every application right now.

We'll review your work again in 60 days. If our take changes, we'll be in touch.`;
  return { subject, html, text };
}
