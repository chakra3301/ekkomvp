"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { requestAdminOtp, verifyAdminOtp } from "./actions";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

const RESEND_COOLDOWN = 60;

export default function AdminLoginPage() {
  const router = useRouter();

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  // Resend cooldown ticker (Supabase rate-limits OTP sends to ~60s/email).
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const sendCode = async () => {
    if (!emailValid || pending || cooldown > 0) return;
    setPending(true);
    setError(null);
    const res = await requestAdminOtp(email);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStep("code");
    setCooldown(RESEND_COOLDOWN);
  };

  const verify = async () => {
    if (code.replace(/\s/g, "").length < 6 || pending) return;
    setPending(true);
    setError(null);
    const res = await verifyAdminOtp(email, code);
    if (!res.ok) {
      setPending(false);
      setError(res.error);
      return;
    }
    // Session cookie is set server-side; refresh so the admin route's server
    // gate sees it, then navigate in.
    router.replace("/admin");
    router.refresh();
  };

  // Auto-submit once a full 6-digit code is entered.
  useEffect(() => {
    if (step === "code" && code.replace(/\s/g, "").length === 6 && !pending) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step]);

  return (
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
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-sm px-5 py-20 sm:py-28">
          <header className="mb-8 text-center">
            <p className="ekko-arches text-3xl sm:text-4xl text-white tracking-wider mb-2">
              EKKO ADMIN
            </p>
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase text-white/65">
              {step === "email" ? "sign in to continue" : "enter your code"}
            </p>
          </header>

          <div className="apple-glass-card p-6 sm:p-8 space-y-5">
            {step === "email" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendCode();
                }}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                    Admin email
                  </Label>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="apple-glass-input"
                  />
                </div>

                {error && <ErrorNote>{error}</ErrorNote>}

                <Button
                  type="submit"
                  disabled={!emailValid || pending}
                  className="apple-glass-button w-full h-12 text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    "Send login code"
                  )}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verify();
                }}
                className="space-y-5"
              >
                <p className="text-sm text-white/70 leading-relaxed">
                  We sent a 6-digit code to{" "}
                  <span className="text-white font-medium">{email}</span>.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-white/90 text-sm font-medium">
                    Login code
                  </Label>
                  <input
                    id="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="123456"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="apple-glass-input font-mono text-center text-2xl tracking-[0.5em]"
                  />
                </div>

                {error && <ErrorNote>{error}</ErrorNote>}

                <Button
                  type="submit"
                  disabled={code.replace(/\s/g, "").length < 6 || pending}
                  className="apple-glass-button w-full h-12 text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & sign in"
                  )}
                </Button>

                <div className="flex items-center justify-between text-[12px] text-white/55">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                    }}
                    className="hover:text-white/85 transition-colors"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={cooldown > 0 || pending}
                    className="hover:text-white/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-6 text-[11px] text-white/45 text-center">
            Restricted to EKKO administrators.
          </p>
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

        .apple-glass-input {
          display: block;
          width: 100%;
          height: 44px;
          padding: 0 14px;
          color: #fff;
          font-size: 15px;
          line-height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
        }
        .apple-glass-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .apple-glass-input:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.16);
        }
        .apple-glass-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.28);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 0 4px rgba(255, 255, 255, 0.06);
        }
        .apple-glass-input:autofill,
        .apple-glass-input:-webkit-autofill {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.05) inset;
          caret-color: #fff;
        }

        .apple-glass-button {
          background: rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(30px) saturate(180%);
          -webkit-backdrop-filter: blur(30px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .apple-glass-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .apple-glass-button:active:not(:disabled) {
          background: rgba(255, 255, 255, 0.24);
        }
      `}</style>
    </main>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-red-200 bg-red-500/15 border border-red-300/20 rounded-md px-3 py-2">
      {children}
    </p>
  );
}
