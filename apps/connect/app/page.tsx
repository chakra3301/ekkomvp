import Link from "next/link";
import Image from "next/image";
import { Heart, Users, Sparkles, ArrowRight, Palette, Music, Camera, Pen } from "lucide-react";

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

const disciplines = [
  { icon: Camera, label: "Photography" },
  { icon: Palette, label: "Design" },
  { icon: Music, label: "Music" },
  { icon: Pen, label: "Writing" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 py-3">
          <Image src="/logo.png" alt="EKKO Connect" width={32} height={32} />
          <Link
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Sign In
          </Link>
        </header>

        {/* Hero with sky background */}
        <section className="relative px-4 pt-4 pb-8 text-center overflow-hidden">
          <div className="absolute inset-0 -top-14">
            <Image
              src="/sky.png"
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 glass-card px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              For Creatives, By Creatives
            </div>

            <h2 className="text-3xl font-bold font-heading leading-tight mb-3" style={{ textShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.15)" }}>
              Find Your
              <br />
              <span className="text-primary" style={{ textShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.6), 0 2px 4px rgba(0,0,0,0.15)" }}>Creative Match</span>
            </h2>

            <p className="text-sm leading-relaxed mb-6 max-w-xs mx-auto text-foreground/80" style={{ textShadow: "0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.5)" }}>
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
                className="inline-flex items-center justify-center h-11 rounded-xl btn-liquid-glass font-medium text-sm"
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* Disciplines */}
        <section className="px-4 pb-6">
          <div className="flex items-center justify-center gap-2">
            {disciplines.map((d) => (
              <div
                key={d.label}
                className="glass-card flex flex-col items-center gap-1 px-3 py-2.5 flex-1"
              >
                <d.icon className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 pb-8">
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

        {/* Features */}
        <section className="px-4 pb-8">
          <div className="glass-card p-5 text-center">
            <h3 className="text-base font-bold font-heading mb-3">
              Why EKKO Connect?
            </h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div>
                <p className="text-sm font-semibold mb-0.5">Rich Profiles</p>
                <p className="text-xs text-muted-foreground">
                  Photos, video, audio & 3D
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">Smart Matching</p>
                <p className="text-xs text-muted-foreground">
                  Filtered by discipline & goals
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">Real Conversations</p>
                <p className="text-xs text-muted-foreground">
                  Chat with your matches
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5">Built for Creatives</p>
                <p className="text-xs text-muted-foreground">
                  Not dating — creating
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-8 text-center">
          <p className="text-muted-foreground text-sm mb-3">
            Ready to find your creative match?
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 h-11 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            Join EKKO Connect
            <ArrowRight className="h-4 w-4" />
          </Link>
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
