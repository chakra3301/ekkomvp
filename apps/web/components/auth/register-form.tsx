"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Palette, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OAuthButtons } from "./oauth-buttons";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["CREATIVE", "CLIENT"], {
      required_error: "Please select a role",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  embedded?: boolean;
  onSwitchToLogin?: () => void;
  onBack?: () => void;
}

export function RegisterForm({
  embedded,
  onSwitchToLogin,
  onBack,
}: RegisterFormProps = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: undefined,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?role=${data.role}`,
        data: {
          role: data.role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Check your email to confirm your account!");
    if (embedded) {
      // Stay on landing and switch to login view so user can sign in after confirming
      onSwitchToLogin?.();
    } else {
      router.push("/login?message=Check your email to confirm your account");
    }
  };

  const formContent = (
    <>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      )}
      <CardHeader className="space-y-1 p-0">
        <CardTitle className="text-2xl font-heading">Create an account</CardTitle>
        <CardDescription>
          Join EKKO and start your creative journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-0 pt-4">
        <OAuthButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={embedded ? "bg-transparent px-2 text-muted-foreground" : "bg-card px-2 text-muted-foreground"}>
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue("role", "CREATIVE")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  selectedRole === "CREATIVE"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Palette
                  className={cn(
                    "h-8 w-8",
                    selectedRole === "CREATIVE"
                      ? "text-accent"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    selectedRole === "CREATIVE"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Creative
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Designer, artist, musician, etc.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setValue("role", "CLIENT")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  selectedRole === "CLIENT"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <Briefcase
                  className={cn(
                    "h-8 w-8",
                    selectedRole === "CLIENT"
                      ? "text-accent"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    selectedRole === "CLIENT"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  Client
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Looking to hire creatives
                </span>
              </button>
            </div>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </CardContent>
      <CardFooter className={embedded ? "p-0 pt-4" : ""}>
        <p className="text-center text-sm text-muted-foreground w-full">
          Already have an account?{" "}
          {onSwitchToLogin ? (
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-accent hover:underline"
            >
              Sign in
            </button>
          ) : (
            <Link href="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          )}
        </p>
      </CardFooter>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{formContent}</div>;
  }

  return <Card>{formContent}</Card>;
}
