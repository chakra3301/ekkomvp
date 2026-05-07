"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <main className="relative min-h-svh w-full overflow-x-hidden bg-black text-white">
      {/* Unicorn background — same projects as the landing page so the brand reads cohesively */}
      {size && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <UnicornScene
            key={size.w < 768 ? "mobile" : "desktop"}
            projectId={size.w < 768 ? "FNbxpXUHThlUBcgNIC2n" : "n6VPNW1AlXtEeqAHt9LA"}
            width={size.w}
            height={size.h}
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.12/dist/unicornStudio.umd.js"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-xl px-5 py-14 sm:py-20">
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

            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5">
              <FormField
                id="email"
                label="Email"
                required
                hint="Where we'll send your invite if approved."
              >
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-input border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                />
              </FormField>

              <FormField
                id="portfolio"
                label="Portfolio link"
                hint="Personal site, IG, Behance, Are.na, anything that shows your work."
              >
                <Input
                  id="portfolio"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="glass-input border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
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
                          "px-3 py-1.5 text-sm rounded-full border transition-all",
                          active
                            ? "bg-white text-black border-white"
                            : "bg-white/5 text-white/85 border-white/20 hover:bg-white/10",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {d.name}
                      </button>
                    );
                  })}
                </div>
              </FormField>

              <FormField id="city" label="City" hint="Helps us prioritize density in your scene.">
                <Input
                  id="city"
                  placeholder="Brooklyn, Tokyo, Lagos…"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  className="glass-input border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                />
              </FormField>

              <FormField
                id="statement"
                label="What are you working on right now?"
                required
                hint={`${statement.length} / ${STATEMENT_MAX}`}
              >
                <Textarea
                  id="statement"
                  rows={4}
                  placeholder="One short paragraph about the project, idea, or scene that's pulling at you."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value.slice(0, STATEMENT_MAX))}
                  required
                  className="glass-input border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30 resize-none"
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
                <Input
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
                  className="glass-input border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30 font-mono uppercase tracking-wider"
                />
              </FormField>

              {submit.error && (
                <p className="text-sm text-red-300/95 bg-red-500/10 border border-red-400/20 rounded-md px-3 py-2">
                  {submit.error.message}
                </p>
              )}

              <Button
                type="submit"
                disabled={!isValid || submit.isPending}
                className="w-full h-12 btn-liquid-glass text-white text-base font-semibold border border-white/30"
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
                Submissions are reviewed by hand. We'll only email you if the answer is yes.
              </p>
            </form>
          </>
        )}
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
    <div className="glass-card p-8 sm:p-10 text-center space-y-5">
      <div className="mx-auto w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
        <Check className="h-6 w-6 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="ekko-arches text-2xl sm:text-3xl text-white tracking-wider">
          APPLICATION RECEIVED
        </h2>
        <p className="text-sm text-white/75 max-w-sm mx-auto leading-relaxed">
          Every submission is reviewed by hand. If the answer is yes, you'll get an invite code at the email you provided. No reply otherwise.
        </p>
      </div>
      <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-white/45">
        listen for the echoes
      </p>
    </div>
  );
}
