import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EKKO Connect — Find Your Creative Match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#0080FF",
              letterSpacing: "-2px",
            }}
          >
            EKKO
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-2px",
            }}
          >
            Connect
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#a0a0a0",
            marginTop: "0",
          }}
        >
          Find Your Creative Match
        </p>
      </div>
    ),
    { ...size }
  );
}
