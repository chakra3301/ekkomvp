import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Public asset base. Override at runtime via EMAIL_ASSET_BASE if you
// ever need to point at a preview deployment. Trailing slash omitted.
const ASSET_BASE = process.env.EMAIL_ASSET_BASE ?? "https://www.ekkoconnect.app";

const fontStack = "'Courier New', Courier, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const colors = {
  bg: "#0a0a0a",
  text: "#f5f5f5",
  muted: "#9a9a9a",
  faint: "#5a5a5a",
};

// Dotted texture rendered via radial-gradient — sharp in Apple/iOS Mail and
// Gmail, falls back to flat dark in Outlook. Two layered gradients give a
// subtle parallax-ish feel without animation.
const dottedBg: React.CSSProperties = {
  backgroundColor: colors.bg,
  backgroundImage:
    "radial-gradient(circle at center, rgba(255,255,255,0.07) 1px, transparent 1.5px)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0",
};

// Faux-glass approximation: semi-transparent dark fill + thin border +
// soft inset highlight. backdrop-filter doesn't work in email, so we
// fake the depth with the inset shadow.
const glass: React.CSSProperties = {
  backgroundColor: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
};

export const emailTokens = { colors, fontStack, ASSET_BASE, glass, dottedBg };

export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>EKKO</title>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: fontStack,
          color: colors.text,
          ...dottedBg,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: "56px 24px",
          }}
        >
          <Section style={{ paddingBottom: 40, textAlign: "center" }}>
            <Img
              src={`${ASSET_BASE}/ekkofontdark.png`}
              alt="EKKO"
              width="120"
              height="auto"
              style={{ margin: "0 auto", display: "block" }}
            />
          </Section>

          {children}

          <Section style={{ paddingTop: 56 }}>
            <hr
              style={{
                border: "none",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                margin: 0,
              }}
            />
            <Text
              style={{
                fontFamily: fontStack,
                fontSize: 11,
                lineHeight: "18px",
                color: colors.faint,
                margin: "16px 0 0",
                letterSpacing: 0.5,
              }}
            >
              EKKO IS INVITE-ONLY BY DESIGN.
              <br />
              YOU&apos;RE GETTING THIS BECAUSE YOU APPLIED AT EKKOCONNECT.APP/APPLY.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
