"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  userRole: string;
}

const CREATIVE_STEPS = [
  { path: "/onboarding/profile", label: "Profile" },
  { path: "/onboarding/skills", label: "Skills" },
  { path: "/onboarding/follows", label: "Follow" },
  { path: "/onboarding/first-post", label: "First Post" },
];

const CLIENT_STEPS = [
  { path: "/onboarding/profile", label: "Profile" },
  { path: "/onboarding/follows", label: "Follow" },
];

export function StepIndicator({ userRole }: StepIndicatorProps) {
  const pathname = usePathname();
  const steps = userRole === "CREATIVE" ? CREATIVE_STEPS : CLIENT_STEPS;
  const currentIndex = steps.findIndex((s) => s.path === pathname);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.path} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-12 mb-5",
                  index < currentIndex ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
