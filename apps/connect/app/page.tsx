"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

type Phase = "typing" | "glitch" | "bsod" | "terminal" | "final";

const CLEAN_TEXT = "#ART IS THE CONSCIOUS, SKILLFUL CREATION OF WORKS THAT EXPRESS";

// Pool used for the rapid scramble cycles (each "rolling" character flickers
// through this pool before either settling on a corrupt glyph or being
// overwritten the next frame).
const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>{}|;:?░▒▓█▀▄■◆";

// Pool of glyphs a position can "settle" into once the scrambler decides
// to lock it. Heavier on numbers / symbols / blocks → reads as corruption.
const CORRUPT = "0123456789!@#$%^&*░▒▓█▀▄■◆◇{}<>|/\\?¥£€¤§¶†‡#&%$";

export default function LandingPage() {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [phase, setPhase] = useState<Phase>("typing");
  const [text, setText] = useState("");

  // Track viewport size for the Unicorn scene.
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Phase 1: clean typing in Arches caps.
  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (i < CLEAN_TEXT.length) {
        i++;
        setText(CLEAN_TEXT.slice(0, i));
        setTimeout(tick, 35 + Math.random() * 50);
      } else {
        setTimeout(() => setPhase("glitch"), 700);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [phase]);

  // Phase 2: hijack — characters in the existing line start cycling through
  // random glyphs. They periodically lock to a corrupt glyph, new corrupt
  // characters get appended, and occasional "spam" bursts repeat or scramble
  // a chunk wholesale. No transform shake — the visual chaos lives in the
  // characters themselves.
  useEffect(() => {
    if (phase !== "glitch") return;

    type Cell = { settled: boolean; value: string };
    const cells: Cell[] = CLEAN_TEXT.split("").map((c) => ({
      settled: false,
      value: c,
    }));

    let cancelled = false;
    let frames = 0;
    const TOTAL_FRAMES = 90;       // ~3.6s at 40ms/frame
    const TARGET_TAIL_LEN = 38;    // how many corrupt chars to grow on the end

    const interval = setInterval(() => {
      if (cancelled) return;
      frames++;

      // Re-roll every unsettled cell.
      for (const cell of cells) {
        if (!cell.settled) {
          cell.value = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        }
      }

      // Lock a few unsettled cells per frame (more aggressive over time).
      const lockCount = 1 + Math.floor(frames / 18);
      for (let n = 0; n < lockCount; n++) {
        const unsettled = cells
          .map((c, i) => ({ c, i }))
          .filter(({ c }) => !c.settled);
        if (unsettled.length === 0) break;
        const pick = unsettled[Math.floor(Math.random() * unsettled.length)];
        pick.c.settled = true;
        pick.c.value = CORRUPT[Math.floor(Math.random() * CORRUPT.length)];
      }

      // Grow the corrupted tail.
      const tailGrowth = cells.length - CLEAN_TEXT.length;
      if (tailGrowth < TARGET_TAIL_LEN && Math.random() < 0.85) {
        cells.push({
          settled: false,
          value: SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)],
        });
      }

      // Occasional spam burst — repeat a glyph or shred a chunk.
      if (Math.random() < 0.06 && cells.length > 10) {
        const start = Math.floor(Math.random() * (cells.length - 6));
        const glyph = CORRUPT[Math.floor(Math.random() * CORRUPT.length)];
        const repeat = Math.random() < 0.5;
        for (let k = 0; k < 5; k++) {
          cells[start + k].settled = false;
          cells[start + k].value = repeat
            ? glyph
            : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        }
      }

      // Occasional "delete-and-overshoot": chop a few chars off the tail.
      if (Math.random() < 0.04 && cells.length > CLEAN_TEXT.length + 4) {
        cells.length -= 1 + Math.floor(Math.random() * 3);
      }

      setText(cells.map((c) => c.value).join(""));

      if (frames >= TOTAL_FRAMES) {
        clearInterval(interval);
        setPhase("bsod");
      }
    }, 40);

    return () => { cancelled = true; clearInterval(interval); };
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

      {/* Phase 1+2: typing / hijack */}
      {(phase === "typing" || phase === "glitch") && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <p
            className="ekko-arches relative max-w-[90vw] text-center text-2xl md:text-4xl leading-snug whitespace-pre-wrap break-words"
            style={{
              filter:
                phase === "glitch"
                  ? "drop-shadow(2px 0 0 #ff0040) drop-shadow(-2px 0 0 #00f0ff)"
                  : "none",
              transition: "filter 200ms",
            }}
          >
            {text}
            {phase === "typing" && (
              <span
                className="inline-block w-[0.55ch] -mb-0.5 ml-1 bg-white align-baseline animate-blink"
                style={{ height: "0.95em" }}
              />
            )}
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
          <p className="ekko-arches text-2xl md:text-4xl text-white/95 mb-3">
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
        @font-face {
          font-family: "ArchesEkko";
          src: url("/fonts/ArchesRegular.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
        .ekko-arches {
          font-family: "ArchesEkko", serif;
          letter-spacing: 0.02em;
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .animate-blink { animation: blink 1s steps(1) infinite; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1.6s ease-out forwards; }
      `}</style>
    </main>
  );
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
