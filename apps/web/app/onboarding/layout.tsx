import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { StepIndicator } from "@/components/onboarding/step-indicator";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = user.user_metadata?.role || "CREATIVE";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="EKKO"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-heading font-bold text-foreground">
              EKKO
            </span>
          </Link>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator userRole={userRole} />

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
