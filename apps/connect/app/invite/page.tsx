"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

const APP_STORE_URL = "https://apps.apple.com/ca/app/ekko/id6759824029";

// Format the canonical 8-char code into ABCD-EFGH for display. Strips
// whitespace/hyphens and uppercases everything else so the same function
// handles `a3f9-k2x7`, `A3F9 K2X7`, etc.
function formatCode(raw: string): string {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  if (cleaned.length !== 8) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export default function InvitePage() {
  const searchParams = useSearchParams();
  const rawCode = searchParams.get("code") ?? "";

  const displayCode = useMemo(() => formatCode(rawCode), [rawCode]);
  const hasCode = displayCode.length === 9; // ABCD-EFGH

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    // Connect locks `overflow: hidden` on html/body for the swipe feed —
    // long-form pages get their own fixed scroll container.
    <main className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-black text-white">
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        {size && (
          <UnicornScene
            key={size.w < 768 ? "mobile" : "desktop"}
            projectId={size.w < 768 ? "FNbxpXUHThlUBcgNIC2n" : "n6VPNW1AlXtEeqAHt9LA"}
            width={size.w}
            height={size.h}
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-xl px-5 py-14 sm:py-20">
          <header className="mb-10 text-center">
            <p className="ekko-arches text-4xl sm:text-5xl text-white tracking-wider mb-3">
              YOU&apos;RE INVITED
            </p>
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase text-white/65">
              EKKO is invite-only by design
            </p>
          </header>

          <section className="apple-glass-card p-8 sm:p-10 space-y-7 text-center">
            {hasCode ? (
              <>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/55 mb-3">
                    your code
                  </p>
                  <p className="font-mono text-2xl sm:text-3xl tracking-[0.25em] text-white">
                    {displayCode}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/80 leading-relaxed">
                    Get the app, sign in with your email, and enter this code when
                    asked.
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/45">
                    codes expire 30 days from issue
                  </p>
                </div>

                <a
                  href={APP_STORE_URL}
                  className="apple-glass-button inline-block rounded-xl px-7 py-3.5 font-mono text-[12px] tracking-[0.2em] uppercase text-white"
                >
                  Get EKKO →
                </a>
              </>
            ) : (
              <>
                <p className="text-base text-white/85 leading-relaxed">
                  This link is missing an invite code. If a friend sent you here,
                  ask them to share their full code.
                </p>
                <Link
                  href="/apply"
                  className="apple-glass-button inline-block rounded-xl px-7 py-3.5 font-mono text-[12px] tracking-[0.2em] uppercase text-white"
                >
                  Apply instead →
                </Link>
              </>
            )}
          </section>

          {hasCode && (
            <p className="mt-6 text-center font-mono text-[11px] tracking-[0.2em] uppercase text-white/55">
              don&apos;t have a code?{" "}
              <Link href="/apply" className="underline underline-offset-4 hover:text-white/80">
                apply
              </Link>
            </p>
          )}
        </div>
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
        .apple-glass-card {
          position: relative;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow:
            0 18px 50px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .apple-glass-button {
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
        }
        .apple-glass-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        .apple-glass-button:active {
          background: rgba(255, 255, 255, 0.24);
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}
