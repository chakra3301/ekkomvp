"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

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
      {size && (
        <div className="absolute inset-0 z-0">
          <UnicornScene
            projectId="n6VPNW1AlXtEeqAHt9LA"
            width={size.w}
            height={size.h}
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
          />
        </div>
      )}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end text-center px-6 pb-[18vh] pointer-events-none">
        <p className="ekko-arches text-3xl md:text-5xl text-white/95 mb-4 tracking-wider">
          LISTEN FOR THE ECHOES
        </p>
        <p className="font-mono text-sm md:text-base tracking-[0.2em] uppercase text-white/70 mb-8">
          invitations starting soon
        </p>
        <a
          href="https://www.instagram.com/ekkoconnect"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto font-mono text-base md:text-lg text-white underline underline-offset-4 decoration-white/50 hover:decoration-white transition"
        >
          @ekkoconnect
        </a>
      </div>

      <style jsx global>{`
        @font-face {
          font-family: "ArchesEkko";
          src: url("/fonts/ArchesRegular.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        .ekko-arches {
          font-family: "ArchesEkko", serif;
          letter-spacing: 0.04em;
        }
      `}</style>
    </main>
  );
}
