"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowUpRight, Apple } from "lucide-react";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

const APP_STORE_URL = "https://apps.apple.com/app/ekko-connect";

export default function LandingPage() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onMotion = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onMotion);

    return () => {
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-black text-white">
      {size && !reduceMotion && (
        <div className="absolute inset-0 z-0">
          <UnicornScene
            projectId="n6VPNW1AlXtEeqAHt9LA"
            width={size.w}
            height={size.h}
            scale={1}
            dpi={size.w < 768 ? 1 : 1.25}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10 md:py-7">
        <div className="flex items-center gap-2.5">
          <Image src="/elogo.png" alt="EKKO" width={28} height={28} className="rounded-md" priority />
          <span className="text-sm font-bold tracking-[0.25em] uppercase">EKKO</span>
        </div>
        <Link
          href="/login"
          className="text-xs tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-20 flex h-[calc(100svh-72px)] flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] tracking-[0.25em] uppercase text-white/85 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Now on iOS
        </span>

        <h1 className="font-heading text-[clamp(2.75rem,9vw,6rem)] font-bold leading-[0.95] tracking-tight">
          A network for
          <br />
          <span className="italic font-light">creatives</span>.
        </h1>

        <p className="mt-6 max-w-md text-base md:text-lg text-white/75 leading-relaxed">
          Discover collaborators, clients, and the people behind the work.
          Swipe, match, build.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
          <a
            href={APP_STORE_URL}
            className="group inline-flex items-center gap-3 rounded-2xl bg-white text-black h-14 px-6 font-medium hover:bg-white/90 transition"
          >
            <Apple className="h-6 w-6" fill="currentColor" />
            <span className="flex flex-col items-start leading-none">
              <span className="text-[10px] tracking-[0.2em] uppercase opacity-70">Download on</span>
              <span className="text-base font-semibold mt-0.5">App Store</span>
            </span>
          </a>

          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-white h-14 px-6 font-medium backdrop-blur-md hover:bg-white/10 transition"
          >
            <span>Try the web app</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>

      <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 md:px-10 text-[10px] tracking-[0.2em] uppercase text-white/50">
        <span>&copy; {new Date().getFullYear()} EKKO</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="hover:text-white/80 transition">Privacy</Link>
          <Link href="/terms" className="hover:text-white/80 transition">Terms</Link>
          <Link href="/support" className="hover:text-white/80 transition">Support</Link>
        </div>
      </footer>
    </main>
  );
}
