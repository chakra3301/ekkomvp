import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LandingAuthPanel } from "@/components/landing/landing-auth-panel";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      {/* Background image */}
      <Image
        src="/landing-bg.png"
        alt=""
        fill
        className="object-cover -z-10"
        priority
      />

      {/* Left half: EKKO title (mobile: stacked center; desktop: left 50%) */}
      <div className="flex flex-1 flex-col items-center justify-center gap-10 p-4 sm:p-8 md:min-h-screen">
        <Image
          src="/ekko-title.png"
          alt="EKKO"
          width={400}
          height={120}
          className="w-80 sm:w-[28rem] md:w-[36rem] h-auto object-contain"
          priority
        />
      </div>

      {/* Right half: login — mobile: centered card; desktop: full right half */}
      <div className="flex w-full flex-1 flex-col justify-center p-4 sm:p-8 md:min-h-screen md:w-1/2 md:p-0">
        <div className="mx-auto w-full max-w-sm md:mx-0 md:max-w-none md:h-full md:min-h-screen md:w-full">
        <div className="glass-modal chrome-border flex h-full min-h-[50vh] flex-col justify-center rounded-lg p-6 md:min-h-screen md:rounded-l-2xl md:rounded-r-none">
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
            <LandingAuthPanel />
          </Suspense>
        </div>
        </div>
      </div>

      {/* Tagline at top — left half on desktop so it doesn't overlap login */}
      <p className="chrome-text absolute top-6 left-10 right-10 text-center text-xs font-medium md:right-1/2 md:pl-32 md:pr-4 md:text-left">
        Collaborate and connect with creatives from all over the world, let the impact of your art <span className="font-semibold">EKKO</span>!
      </p>
    </div>
  );
}
