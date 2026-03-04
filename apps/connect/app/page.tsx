import Link from "next/link";
import Image from "next/image";
import { Heart, Users, Sparkles, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Build Your Profile",
    description: "Showcase your work with photos, videos, audio, and 3D models.",
  },
  {
    icon: Heart,
    title: "Discover Creatives",
    description: "Swipe through profiles tailored to your interests and disciplines.",
  },
  {
    icon: Users,
    title: "Connect & Collaborate",
    description: "Match with creatives and start meaningful conversations.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg">
        {/* Hero with blurred sky background */}
        <section className="relative px-4 pt-16 pb-8 text-center overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/sky.png"
              alt=""
              fill
              className="object-cover blur-[2px] scale-[1.02]"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 glass-card px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              For Creatives, By Creatives
            </div>

            <h2 className="text-3xl font-bold font-heading leading-tight mb-3 text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
              Find Your
              <br />
              <span className="text-primary" style={{ textShadow: "0 0 20px rgba(255,255,255,0.6), 0 2px 8px rgba(0,0,0,0.3)" }}>Creative Match</span>
            </h2>

            <p className="text-sm leading-relaxed mb-6 max-w-xs mx-auto text-white/90" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
              Discover collaborators, clients, and creatives who share your
              passion. Swipe, match, and create together.
            </p>

            <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-11 rounded-xl btn-liquid-glass font-medium text-sm text-black"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-8">
          <h3 className="text-base font-bold font-heading text-center mb-4">
            How It Works
          </h3>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.title} className="glass-card p-3 flex items-start gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0">
                  <step.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <h4 className="font-bold text-sm">{step.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/20 dark:border-white/10 px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} EKKO. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
