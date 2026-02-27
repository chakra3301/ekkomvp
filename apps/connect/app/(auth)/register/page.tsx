"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [contactMode, setContactMode] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const daysInMonth = getDaysInMonth(
    Number(dobMonth),
    Number(dobYear) || currentYear
  );

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = "Name is required";
    }

    if (contactMode === "email" && !email.trim()) {
      errs.contact = "Email is required";
    }
    if (contactMode === "phone" && !phone.trim()) {
      errs.contact = "Phone number is required";
    }

    if (!dobMonth || !dobDay || !dobYear) {
      errs.dob = "Date of birth is required";
    } else {
      const dob = new Date(Number(dobYear), Number(dobMonth) - 1, Number(dobDay));
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())
          ? age - 1
          : age;
      if (actualAge < 13) {
        errs.dob = "You must be at least 13 years old";
      }
    }

    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Build ISO date string
    const dateOfBirth = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;

    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required for account verification" }));
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Check your email for verification.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading">
            <span className="text-primary">EKKO</span> Connect
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your account
          </p>
        </div>

        <OAuthButtons />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background/60 px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="fullName">Name</Label>
              <span className="text-xs text-muted-foreground">
                {fullName.length} / 50
              </span>
            </div>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                if (e.target.value.length <= 50) setFullName(e.target.value);
              }}
              maxLength={50}
              required
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            )}
          </div>

          {/* Phone or Email contact */}
          <div className="space-y-1.5">
            {contactMode === "phone" ? (
              <>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                />
              </>
            ) : (
              <>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </>
            )}
            {errors.contact && (
              <p className="text-xs text-destructive">{errors.contact}</p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setContactMode(contactMode === "phone" ? "email" : "phone")
                }
                className="text-xs text-primary hover:underline"
              >
                Use {contactMode === "phone" ? "email" : "phone"} instead
              </button>
            </div>
          </div>

          {/* Email field (always needed for Supabase, shown when phone is primary) */}
          {contactMode === "phone" && (
            <div className="space-y-1.5">
              <Label htmlFor="email-secondary">
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (for verification)
                </span>
              </Label>
              <Input
                id="email-secondary"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          )}

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label>Date of birth</Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will not be shown publicly. Confirm your own age, even if
              this account is for a business, a pet, or something else.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {/* Month */}
              <select
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="" disabled>
                  Month
                </option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1)}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Day */}
              <select
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="" disabled>
                  Day
                </option>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (d) => (
                    <option key={d} value={String(d)}>
                      {d}
                    </option>
                  )
                )}
              </select>

              {/* Year */}
              <select
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="" disabled>
                  Year
                </option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {errors.dob && (
              <p className="text-xs text-destructive">{errors.dob}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base rounded-full"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Next"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
