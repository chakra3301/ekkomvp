import * as React from "react";
import { Img, Section, Text } from "@react-email/components";
import { EmailShell, emailTokens } from "./_shell";

const { colors, fontStack, ASSET_BASE, glass } = emailTokens;

export default function WaitlistedEmail() {
  return (
    <EmailShell preview="Thanks for applying to EKKO.">
      <Section style={{ textAlign: "center", paddingBottom: 32 }}>
        <Img
          src={`${ASSET_BASE}/email/heading-waitlisted.png`}
          alt="THANKS FOR APPLYING."
          width="440"
          height="auto"
          style={{ margin: "0 auto", display: "block", maxWidth: "100%" }}
        />
      </Section>

      <Section style={{ ...glass, padding: 28, textAlign: "left" }}>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 13,
            lineHeight: "22px",
            color: colors.text,
            margin: 0,
            letterSpacing: 0.3,
          }}
        >
          EKKO is in its early invite-only phase, and we can&apos;t accept every
          application right now.
        </Text>
        <Text
          style={{
            fontFamily: fontStack,
            fontSize: 13,
            lineHeight: "22px",
            color: colors.muted,
            margin: "16px 0 0",
            letterSpacing: 0.3,
          }}
        >
          We&apos;ll review your work again in 60 days. If our take changes, we&apos;ll be
          in touch.
        </Text>
      </Section>
    </EmailShell>
  );
}

WaitlistedEmail.PreviewProps = {} as Record<string, never>;
