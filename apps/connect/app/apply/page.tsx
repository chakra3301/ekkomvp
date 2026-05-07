"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { DISCIPLINES } from "@ekko/config";

const UnicornScene = dynamic(() => import("unicornstudio-react"), { ssr: false });

const STATEMENT_MAX = 280;
const MAX_DISCIPLINES = 8;

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const initialReferralCode = (searchParams.get("ref") ?? searchParams.get("code") ?? "")
    .replace(/[\s-]/g, "")
    .toUpperCase();

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Form state
  const [email, setEmail] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [statement, setStatement] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [touchedReferral, setTouchedReferral] = useState(false);

  const submit = trpc.signupApplication.submit.useMutation();

  const isValid = useMemo(() => {
    const trimmedEmail = email.trim();
    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) &&
      selectedDisciplines.length > 0 &&
      statement.trim().length > 0 &&
      statement.length <= STATEMENT_MAX
    );
  }, [email, selectedDisciplines, statement]);

  const toggleDiscipline = (slug: string) => {
    setSelectedDisciplines((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_DISCIPLINES) return prev;
      return [...prev, slug];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submit.isPending) return;
    submit.mutate({
      email: email.trim(),
      portfolioUrl: portfolioUrl.trim() || "",
      disciplines: selectedDisciplines,
      city: city.trim() || undefined,
      statement: statement.trim(),
      referralCode: referralCode.trim() || undefined,
    });
  };

  return (
    // The connect app locks `overflow: hidden` on html/body globally
    // (globals.css:325, intentional for the swipe feed). Make this page its
    // own scroll container by fixing main to the viewport with overflow-y-auto.
    <main className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-black text-white">
      {/* Background pinned to the viewport (fixed positions relative to the
          viewport regardless of ancestor positioning). */}
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
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-xl px-5 py-14 sm:py-20">
          {submit.isSuccess ? (
            <SuccessCard />
          ) : (
            <>
              <header className="mb-8 text-center">
                <p className="ekko-arches text-3xl sm:text-4xl text-white tracking-wider mb-2">
                  LISTEN FOR THE ECHOES
                </p>
                <p className="font-mono text-[11px] sm:text-xs tracking-[0.25em] uppercase text-white/65">
                  apply for an invitation
                </p>
              </header>

              <form onSubmit={handleSubmit} className="apple-glass-card p-6 sm:p-8 space-y-5">
                <FormField
                  id="email"
                  label="Email"
                  required
                  hint="Where we'll send your invite if approved."
                >
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="apple-glass-input"
                  />
                </FormField>

                <FormField
                  id="portfolio"
                  label="Portfolio link"
                  hint="Personal site, IG, Behance, Are.na, anything that shows your work."
                >
                  <input
                    id="portfolio"
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="apple-glass-input"
                  />
                </FormField>

                <FormField
                  id="disciplines"
                  label="Disciplines"
                  required
                  hint={
                    selectedDisciplines.length === 0
                      ? "Pick what you do. Multiple is fine."
                      : `${selectedDisciplines.length} selected${
                          selectedDisciplines.length >= MAX_DISCIPLINES ? " (max)" : ""
                        }`
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {DISCIPLINES.map((d) => {
                      const active = selectedDisciplines.includes(d.slug);
                      const disabled =
                        !active && selectedDisciplines.length >= MAX_DISCIPLINES;
                      return (
                        <button
                          type="button"
                          key={d.slug}
                          onClick={() => toggleDiscipline(d.slug)}
                          disabled={disabled}
                          aria-pressed={active}
                          className={cn(
                            "px-3 py-1.5 text-sm rounded-full transition-all",
                            active
                              ? "apple-glass-chip-active"
                              : "apple-glass-chip",
                            disabled && "opacity-40 cursor-not-allowed"
                          )}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField
                  id="city"
                  label="City"
                  hint="Helps us prioritize density in your scene."
                >
                  <input
                    id="city"
                    placeholder="Brooklyn, Tokyo, Lagos…"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={80}
                    className="apple-glass-input"
                  />
                </FormField>

                <FormField
                  id="statement"
                  label="What are you working on right now?"
                  required
                  hint={`${statement.length} / ${STATEMENT_MAX}`}
                >
                  <textarea
                    id="statement"
                    rows={4}
                    placeholder="One short paragraph about the project, idea, or scene that's pulling at you."
                    value={statement}
                    onChange={(e) => setStatement(e.target.value.slice(0, STATEMENT_MAX))}
                    required
                    className="apple-glass-input resize-none leading-relaxed"
                  />
                </FormField>

                <FormField
                  id="referral"
                  label="Referral code"
                  hint={
                    initialReferralCode && !touchedReferral
                      ? "Pre-filled from your invite link."
                      : "Optional. From an EKKO member."
                  }
                >
                  <input
                    id="referral"
                    placeholder="ABCD-EFGH"
                    value={referralCode}
                    onChange={(e) => {
                      setTouchedReferral(true);
                      setReferralCode(
                        e.target.value
                          .replace(/[\s-]/g, "")
                          .toUpperCase()
                          .slice(0, 16)
                      );
                    }}
                    className="apple-glass-input font-mono uppercase tracking-wider"
                  />
                </FormField>

                {submit.error && (
                  <p className="text-sm text-red-200 bg-red-500/15 border border-red-300/20 rounded-md px-3 py-2">
                    {submit.error.message}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!isValid || submit.isPending}
                  className="apple-glass-button w-full h-12 text-white text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submit.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>

                <p className="text-[11px] text-white/55 text-center">
                  Submissions are reviewed by hand. We&apos;ll only email you if the answer is yes.
                </p>
              </form>
            </>
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

        /* Apple ultraThinMaterial-equivalent glass — translucent fill that
           samples content behind, strong blur with saturation boost, subtle
           1px white stroke. Tuned for dark backgrounds. */
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

        textarea.apple-glass-input {
          height: auto;
          line-height: 1.5;
          padding: 12px 14px;
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

        .apple-glass-chip {
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(160%);
          -webkit-backdrop-filter: blur(20px) saturate(160%);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .apple-glass-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .apple-glass-chip-active {
          color: #000;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
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

function FormField({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-white/90 text-sm font-medium">
          {label}
          {required && <span className="text-white/40 ml-1">*</span>}
        </Label>
        {hint && (
          <span className="text-[11px] text-white/50 leading-tight text-right">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SuccessCard() {
  return (
    <div className="apple-glass-card p-8 sm:p-10 text-center space-y-5">
      <div className="mx-auto w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
        <Check className="h-6 w-6 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="ekko-arches text-2xl sm:text-3xl text-white tracking-wider">
          APPLICATION RECEIVED
        </h2>
        <p className="text-sm text-white/75 max-w-sm mx-auto leading-relaxed">
          Every submission is reviewed by hand. If the answer is yes, you&apos;ll get an invite code at the email you provided. No reply otherwise.
        </p>
      </div>
      <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/45">
        listen for the echoes
      </p>
    </div>
  );
}
