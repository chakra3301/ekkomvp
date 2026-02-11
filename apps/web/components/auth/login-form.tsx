"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  embedded?: boolean;
  redirectTo?: string;
  onSwitchToRegister?: () => void;
  onBack?: () => void;
}

export function LoginForm({
  embedded,
  redirectTo: redirectToProp,
  onSwitchToRegister,
  onBack,
}: LoginFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = redirectToProp ?? searchParams.get("redirect") ?? "/feed";
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push(redirectTo);
    router.refresh();
  };

  const content = (
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
      <CardHeader className={embedded ? "space-y-1 p-0" : "space-y-1"}>
        <CardTitle className="text-2xl font-heading">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className={embedded ? "space-y-4 p-0 pt-4" : "space-y-4"}>
        <OAuthButtons redirectTo={redirectTo} />

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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className={embedded ? "p-0 pt-4" : ""}>
        <p className="text-center text-sm text-muted-foreground w-full">
          Don&apos;t have an account?{" "}
          {onSwitchToRegister ? (
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-accent hover:underline"
            >
              Sign up
            </button>
          ) : (
            <Link href="/register" className="text-accent hover:underline">
              Sign up
            </Link>
          )}
        </p>
      </CardFooter>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return <Card>{content}</Card>;
}
