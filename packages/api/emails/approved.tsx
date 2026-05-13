import * as React from "react";
import { Button, Img, Section, Text } from "@react-email/components";
import { EmailShell, emailTokens } from "./_shell";

const { colors, fontStack, ASSET_BASE, glass } = emailTokens;
const APP_STORE_URL = "https://apps.apple.com/ca/app/ekko/id6759824029";

export default function ApprovedEmail() {
  return (
    <EmailShell preview="You're in — welcome to EKKO.">
      <Section style={{ textAlign: "center", paddingBottom: 32 }}>
        <Img
          src={`${ASSET_BASE}/email/heading-approved.png`}
          alt="YOU'RE IN."
          width="420"
          height="auto"
          style={{ margin: "0 auto", display: "block", maxWidth: "100%" }}
        />
      </Section>

      <Section style={{ ...glass, padding: 28, textAlign: "left" }}>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 14,
            lineHeight: "22px",
            color: colors.text,
            margin: 0,
            letterSpacing: 0.3,
          }}
        >
          YOUR APPLICATION&apos;S APPROVED.
        </Text>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 13,
            lineHeight: "22px",
            color: colors.muted,
            margin: "12px 0 0",
            letterSpacing: 0.3,
          }}
        >
          EKKO is invite-only — sign in with this email address to claim your spot.
        </Text>
      </Section>

      <Section style={{ paddingTop: 24, textAlign: "center" }}>
        <Button
          href={APP_STORE_URL}
          style={{
            display: "inline-block",
            fontFamily: fontStack,
            fontSize: 13,
            letterSpacing: 1.5,
            fontWeight: 600,
            color: colors.text,
            textDecoration: "none",
            padding: "18px 36px",
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 6,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          GET EKKO ON THE APP STORE →
        </Button>
      </Section>

      <Section style={{ paddingTop: 24 }}>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 12,
            lineHeight: "20px",
            color: colors.faint,
            margin: 0,
            textAlign: "center",
            letterSpacing: 0.4,
          }}
        >
          ALREADY HAVE THE APP? SIGN IN WITH THIS EMAIL AND YOU&apos;LL LAND STRAIGHT IN.
        </Text>
      </Section>
    </EmailShell>
  );
}

ApprovedEmail.PreviewProps = {} as Record<string, never>;
