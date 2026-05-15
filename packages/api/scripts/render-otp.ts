/**
 * Renders emails/otp.tsx to static HTML, then substitutes the
 * `__OTP_CODE__` placeholder with Supabase's `{{ .Token }}` template
 * variable. Writes the result to emails/otp-supabase.html — copy that
 * file's contents into Supabase Auth → Email Templates → Magic Link.
 *
 * Run with: pnpm --filter @ekko/api render-otp
 *
 * The output is checked into git so the next developer can see what's
 * currently in Supabase without running the script.
 */
import * as React from "react";
import { render } from "@react-email/render";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import OtpEmail from "../emails/otp";

async function main() {
  const html = await render(React.createElement(OtpEmail));
  // Swap our placeholder for Supabase's templating var. Done as a
  // post-process substitution because Supabase's `{{ ... }}` looks like
  // a React expression and trips the JSX parser if used inline.
  const withToken = html.replaceAll("__OTP_CODE__", "{{ .Token }}");
  const outPath = resolve(__dirname, "../emails/otp-supabase.html");
  writeFileSync(outPath, withToken, "utf8");
  console.log(`wrote ${outPath} (${withToken.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
