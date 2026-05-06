"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

type Phase = "typing" | "glitch" | "bsod" | "terminal" | "final";

const CLEAN_TEXT = "#ART is the conscious, skillful creation of works that express";
const CORRUPT_TAIL = " em0ti0n5, ide@s 4nd ░▒▓ ddkdjsiisjr99284002&2&4$@^%{^¥¥|£€<>|€£…";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#░▒▓█▀▄■□●○◆◇@$%&";

export default function LandingPage() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState("");
  const [shake, setShake] = useState(false);

  // Track viewport size for the Unicorn scene.
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Phase 1 → 2: type the clean line, then the glitching tail.
  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      if (i < CLEAN_TEXT.length) {
        i++;
        setTyped(CLEAN_TEXT.slice(0, i));
        const delay = 35 + Math.random() * 50;
        setTimeout(tick, delay);
      } else {
        setTimeout(() => setPhase("glitch"), 600);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "glitch") return;
    let j = 0;
    let cancelled = false;
    const base = CLEAN_TEXT;

    const tick = () => {
      if (cancelled) return;
      if (j < CORRUPT_TAIL.length) {
        j++;
        // Occasional jitter: scramble a recent chunk briefly.
        const tail = CORRUPT_TAIL.slice(0, j);
        const jittered =
          Math.random() < 0.25 && tail.length > 4
            ? tail.slice(0, -3) + randChars(3)
            : tail;
        setTyped(base + jittered);
        const delay = 15 + Math.random() * 80;
        setTimeout(tick, delay);
      } else {
        setShake(true);
        setTimeout(() => setPhase("bsod"), 900);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [phase]);

  // Phase 3: BSOD pause.
  useEffect(() => {
    if (phase !== "bsod") return;
    const t = setTimeout(() => setPhase("terminal"), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 4: terminal pause.
  useEffect(() => {
    if (phase !== "terminal") return;
    const t = setTimeout(() => setPhase("final"), 2800);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <main className="relative h-svh w-full overflow-hidden bg-black text-white">
      {/* Unicorn scene mounted from the start so it's warm by the final phase. */}
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

      {/* Black mask covering the scene during pre-final phases. */}
      <div
        className="absolute inset-0 z-10 bg-black transition-opacity duration-[1200ms] ease-out"
        style={{ opacity: phase === "final" ? 0 : 1, pointerEvents: "none" }}
      />

      {/* Phase 1+2: typing / glitching */}
      {(phase === "typing" || phase === "glitch") && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <p
            className={`relative max-w-[90vw] text-center font-mono text-xl md:text-3xl leading-snug whitespace-pre-wrap ${shake ? "animate-shake" : ""}`}
            style={{
              filter:
                phase === "glitch"
                  ? "drop-shadow(2px 0 0 #ff0040) drop-shadow(-2px 0 0 #00f0ff)"
                  : "none",
              transition: "filter 200ms",
            }}
          >
            {typed}
            <span className="inline-block w-[0.6ch] -mb-0.5 ml-0.5 bg-white align-baseline animate-blink" style={{ height: "1em" }} />
          </p>
        </div>
      )}

      {/* Phase 3: Blue Screen of Death */}
      {phase === "bsod" && (
        <div className="absolute inset-0 z-30 bg-[#0078D7] text-white font-mono px-8 md:px-20 py-12 md:py-24 overflow-hidden">
          <div className="text-7xl md:text-9xl font-light leading-none mb-8">:(</div>
          <p className="text-base md:text-xl max-w-3xl leading-relaxed">
            EKKO ran into a problem and needs to restart. We&apos;re collecting
            some error info, and then we&apos;ll restart for you.
          </p>
          <p className="mt-8 text-xs md:text-sm opacity-90">
            Stop code: <span className="font-bold">FATAL_ART_EXCEPTION</span>
          </p>
          <p className="mt-2 text-xs md:text-sm opacity-90">
            What failed: <span className="font-bold">ekko.sys</span>
          </p>
        </div>
      )}

      {/* Phase 4: Terminal */}
      {phase === "terminal" && (
        <div className="absolute inset-0 z-30 bg-black text-[#9eff9e] font-mono px-6 md:px-16 py-12 md:py-20 text-sm md:text-lg leading-loose">
          <TerminalLines />
        </div>
      )}

      {/* Phase 5: Final overlay over the Unicorn scene */}
      {phase === "final" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 animate-fade-in pointer-events-none">
          <p className="font-mono text-base md:text-xl tracking-wider text-white/90 mb-3">
            . . . listen for the echoes.
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
      )}

      <style jsx global>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s steps(1) infinite; }

        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-3px, 1px) skewX(-2deg); }
          20% { transform: translate(2px, -2px) skewX(1deg); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(2px, 1px) skewX(-1deg); }
          50% { transform: translate(-2px, -1px) skewX(2deg); }
          60% { transform: translate(1px, 2px); }
          70% { transform: translate(-2px, 1px); }
          80% { transform: translate(2px, -2px) skewX(1deg); }
          90% { transform: translate(-1px, -1px); }
        }
        .animate-shake { animation: shake 200ms infinite; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.6s ease-out forwards; }
      `}</style>
    </main>
  );
}

function randChars(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return s;
}

function TerminalLines() {
  const [lines, setLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  const queue = useRef([
    { text: "system failure . . .", delay: 300 },
    { text: "> rebooting", delay: 900 },
  ]);

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled || i >= queue.current.length) return;
      const { text, delay } = queue.current[i];
      setTimeout(() => {
        if (cancelled) return;
        setLines((prev) => [...prev, text]);
        i++;
        tick();
      }, delay);
    };
    tick();

    const blink = setInterval(() => setShowCursor((c) => !c), 500);
    return () => { cancelled = true; clearInterval(blink); };
  }, []);

  return (
    <div>
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      <span>{showCursor ? "▊" : " "}</span>
    </div>
  );
}
