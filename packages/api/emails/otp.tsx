import * as React from "react";
import { Section, Text } from "@react-email/components";
import { EmailShell, emailTokens } from "./_shell";

const { colors, fontStack, glass } = emailTokens;

// Render this with `__OTP_CODE__` as the literal placeholder for the
// 6-digit token. The render script substitutes Supabase's `{{ .Token }}`
// in the final HTML — see scripts/render-otp.ts.
const OTP_PLACEHOLDER = "__OTP_CODE__";

export default function OtpEmail() {
  return (
    <EmailShell preview="Your EKKO sign-in code.">
      <Section style={{ ...glass, padding: 28, textAlign: "center" }}>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 11,
            lineHeight: "16px",
            color: colors.muted,
            margin: 0,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Your sign-in code
        </Text>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 44,
            lineHeight: "52px",
            fontWeight: 700,
            color: colors.text,
            margin: "16px 0 0",
            letterSpacing: 12,
          }}
        >
          {OTP_PLACEHOLDER}
        </Text>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 13,
            lineHeight: "22px",
            color: colors.text,
            margin: 0,
            textAlign: "center",
            letterSpacing: 0.3,
          }}
        >
          Enter this code in the EKKO app to sign in.
        </Text>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 11,
            lineHeight: "18px",
            color: colors.faint,
            margin: "12px 0 0",
            textAlign: "center",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          Code expires in 60 minutes. Didn&apos;t request this? Ignore the email.
        </Text>
      </Section>
    </EmailShell>
  );
}

OtpEmail.PreviewProps = {} as Record<string, never>;
