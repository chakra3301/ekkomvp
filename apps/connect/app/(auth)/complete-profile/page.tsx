"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Palette, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const steps = ["About You", "Your Role"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [nameFromProvider, setNameFromProvider] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [role, setRole] = useState<"CREATIVE" | "CLIENT" | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const completeInfo = trpc.auth.completeUserInfo.useMutation();
  const updateProfile = trpc.profile.update.useMutation();

  // Pre-populate name from OAuth provider metadata (Apple/Google)
  useEffect(() => {
    const loadUserMetadata = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
        setNameFromProvider(true);
      }
    };
    loadUserMetadata();
  }, []);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!nameFromProvider && (!displayName.trim() || displayName.trim().length < 2)) {
      errs.displayName = "Name must be at least 2 characters";
    }
    if (!dateOfBirth) {
      errs.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(dateOfBirth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      const actualAge =
        monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())
          ? age - 1
          : age;
      if (actualAge < 13) {
        errs.dateOfBirth = "You must be at least 13 years old";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateStep1()) return;
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!role) return;

    setLoading(true);
    try {
      // Auto-generate username from display name
      const username = displayName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      const finalUsername = username.length >= 3 ? username : `user_${Date.now().toString(36)}`;

      // 1. Update User record with DOB + role
      await completeInfo.mutateAsync({
        fullName: displayName.trim(),
        dateOfBirth,
        role,
      });

      // 2. Create Profile record with username + display name (upsert)
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        username: finalUsername,
      });

      // 3. Store in Supabase metadata
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          date_of_birth: dateOfBirth,
          role,
        },
      });

      toast.success("Profile created!");
      router.push("/profile/setup");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      if (message.toLowerCase().includes("username")) {
        // Username conflict — retry with timestamp suffix
        try {
          const fallbackUsername = `user_${Date.now().toString(36)}`;
          await updateProfile.mutateAsync({
            displayName: displayName.trim(),
            username: fallbackUsername,
          });
          toast.success("Profile created!");
          router.push("/profile/setup");
          return;
        } catch {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        toast.error(message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="p-4 max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading">
            <span className="text-primary">EKKO</span> Connect
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your profile to get started
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-0.5",
                    i < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Display Name + DOB */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-xl font-bold font-heading mb-1">About You</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Tell us your name and date of birth.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
                {errors.displayName && (
                  <p className="text-xs text-destructive">{errors.displayName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will not be shown publicly.
                </p>
                {errors.dateOfBirth && (
                  <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Creative or Client */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-bold font-heading mb-1">Your Role</h2>
            <p className="text-muted-foreground text-sm mb-6">
              How will you use EKKO Connect?
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setRole("CREATIVE")}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  role === "CREATIVE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      role === "CREATIVE"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Palette className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Creative</p>
                    <p className="text-sm text-muted-foreground">
                      I create work and want to connect with others
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRole("CLIENT")}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  role === "CLIENT"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      role === "CLIENT"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Client</p>
                    <p className="text-sm text-muted-foreground">
                      I&apos;m looking to find and hire creatives
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStep > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep(0)}
              disabled={loading}
            >
              Back
            </Button>
          )}
          {currentStep === 0 ? (
            <Button className="flex-1" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!role || loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
