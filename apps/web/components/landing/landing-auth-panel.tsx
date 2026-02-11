"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

type View = "welcome" | "login" | "register";

export function LandingAuthPanel() {
  const [view, setView] = useState<View>("welcome");

  if (view === "login") {
    return (
      <LoginForm
        embedded
        redirectTo="/feed"
        onBack={() => setView("welcome")}
        onSwitchToRegister={() => setView("register")}
      />
    );
  }

  if (view === "register") {
    return (
      <RegisterForm
        embedded
        onBack={() => setView("welcome")}
        onSwitchToLogin={() => setView("login")}
      />
    );
  }

  return (
    <>
      <h2
        className="chrome-text -mt-8 text-center text-2xl font-bold italic md:-mt-16 md:text-6xl"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        Welcome to EKKO
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        Sign in or create an account to get started.
      </p>
      <div className="flex flex-col gap-3 pt-2">
        <Button
          className="w-full"
          size="lg"
          onClick={() => setView("login")}
        >
          Log in
        </Button>
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={() => setView("register")}
        >
          Sign up
        </Button>
        <Link href="/discover" className="block">
          <Button variant="ghost" className="w-full" size="lg">
            Explore
          </Button>
        </Link>
      </div>
    </>
  );
}
