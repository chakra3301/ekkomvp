"use client";

import dynamic from "next/dynamic";
import Script from "next/script";
import { useEffect, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

// Tell TypeScript about the <model-viewer> Web Component so JSX accepts it.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean | "";
          "auto-rotate-delay"?: string | number;
          "rotation-per-second"?: string;
          "disable-zoom"?: boolean | "";
          "disable-pan"?: boolean | "";
          "disable-tap"?: boolean | "";
          "interaction-prompt"?: "auto" | "when-focused" | "none";
          "shadow-intensity"?: string | number;
          exposure?: string | number;
          "camera-orbit"?: string;
          "field-of-view"?: string;
          loading?: "auto" | "lazy" | "eager";
          reveal?: "auto" | "manual";
        },
        HTMLElement
      >;
    }
  }
}

export default function LandingPage() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-black text-white">
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {size && (
        <div className="absolute inset-0 z-0">
          <UnicornScene
            key={size.w < 768 ? "mobile" : "desktop"}
            projectId={size.w < 768 ? "FNbxpXUHThlUBcgNIC2n" : "n6VPNW1AlXtEeqAHt9LA"}
            width={size.w}
            height={size.h}
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
          />
        </div>
      )}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-center px-6 pb-[6vh] pointer-events-none">
        <p className="ekko-arches text-3xl md:text-5xl text-white/95 mb-4 tracking-wider">
          LISTEN FOR THE ECHOES
        </p>
        <p className="font-mono text-sm md:text-base tracking-[0.2em] uppercase text-white/70 mb-6">
          invitations starting soon
        </p>

        <a
          href="https://www.instagram.com/ekkoconnect"
          target="_blank"
          rel="noreferrer"
          aria-label="Open EKKO on Instagram"
          className="ekko-mark-link pointer-events-auto block"
        >
          <model-viewer
            src="/models/ekko-mark.glb"
            alt="EKKO"
            disable-zoom
            disable-pan
            disable-tap
            interaction-prompt="none"
            shadow-intensity="0"
            exposure="1.1"
            loading="eager"
            reveal="auto"
            style={{
              width: "180px",
              height: "180px",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          />
        </a>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: "ArchesEkko";
          src: url("/fonts/ArchesRegular.otf") format("opentype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        .ekko-arches {
          font-family: "ArchesEkko", serif;
          letter-spacing: 0.04em;
        }

        .ekko-mark-link {
          transition: transform 220ms ease-out, filter 220ms ease-out;
          filter: drop-shadow(0 8px 28px rgba(0, 0, 0, 0.45));
        }
        .ekko-mark-link:hover {
          transform: translateY(-2px) scale(1.03);
          filter: drop-shadow(0 12px 36px rgba(255, 255, 255, 0.25));
        }
        @media (min-width: 768px) {
          .ekko-mark-link model-viewer {
            width: 220px !important;
            height: 220px !important;
          }
        }
      `}</style>
    </main>
  );
}
