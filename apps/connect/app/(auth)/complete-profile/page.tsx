"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [nameFromProvider, setNameFromProvider] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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

  // Auto-generate username from display name
  useEffect(() => {
    if (displayName && !username) {
      const generated = displayName
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      if (generated.length >= 3) {
        setUsername(generated);
      }
    }
  }, [displayName, username]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nameFromProvider && (!displayName.trim() || displayName.trim().length < 2)) {
      errs.displayName = "Name must be at least 2 characters";
    }
    if (!username.trim() || username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      errs.username = "Only letters, numbers, and underscores";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 1. Update User record with DOB + phone
      await completeInfo.mutateAsync({
        fullName: displayName.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth,
      });

      // 2. Create Profile record with username + display name (upsert)
      await updateProfile.mutateAsync({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
      });

      // 3. Store in Supabase metadata
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          phone: phone.trim() || undefined,
          date_of_birth: dateOfBirth,
        },
      });

      toast.success("Profile created!");
      router.push("/profile/setup");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      if (message.toLowerCase().includes("username")) {
        setErrors((prev) => ({ ...prev, username: "Username is already taken" }));
      } else {
        toast.error(message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold font-heading">
            <span className="text-primary">EKKO</span> Connect
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your profile to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!nameFromProvider && (
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
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                }
                placeholder="username"
                className="pl-7"
                maxLength={30}
                required
              />
            </div>
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
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
            {errors.dateOfBirth && (
              <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
