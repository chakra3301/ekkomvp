import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";

import ApprovedEmail from "../../emails/approved";
import WaitlistedEmail from "../../emails/waitlisted";

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
// Templates live as React components in /packages/api/emails. Preview them
// locally with `pnpm --filter @ekko/api preview-emails` (boots react-email
// dev server with hot reload at http://localhost:3000).

export async function applicationApprovedTemplate(): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  const element = React.createElement(ApprovedEmail);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return {
    subject: "You're in — welcome to EKKO.",
    html,
    text,
  };
}

export async function applicationWaitlistedTemplate(): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  const element = React.createElement(WaitlistedEmail);
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return {
    subject: "Thanks for applying to EKKO",
    html,
    text,
  };
}
