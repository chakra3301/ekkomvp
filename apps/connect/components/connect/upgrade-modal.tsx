"use client";

import { Check, Infinity, Sparkles, Eye, Globe, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: string;
}

const FREE_FEATURES = [
  "10 likes per day",
  "6 media slots",
  "City + distance search",
  "Basic discovery",
];

const INFINITE_FEATURES = [
  { label: "Unlimited likes", icon: Infinity },
  { label: "12 media slots", icon: Sparkles },
  { label: "See who likes you", icon: Eye },
  { label: "Global search", icon: Globe },
  { label: "Top of discovery stack", icon: Zap },
  { label: "Infinite badge on profile", icon: Sparkles },
];

export function UpgradeModal({
  open,
  onOpenChange,
  trigger,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-heading">
            Upgrade to{" "}
            <span className="text-primary">
              Infinite <Infinity className="inline h-5 w-5" />
            </span>
          </DialogTitle>
        </DialogHeader>

        {trigger && (
          <p className="text-center text-sm text-muted-foreground -mt-2">
            {trigger}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Free column */}
          <div className="glass-card p-4 rounded-xl">
            <h3 className="font-semibold text-sm mb-3">Free</h3>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Check className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Infinite column */}
          <div className="glass-card p-4 rounded-xl border border-primary/30 bg-primary/5">
            <h3 className="font-semibold text-sm mb-3 text-primary flex items-center gap-1">
              Infinite <Infinity className="h-3.5 w-3.5" />
            </h3>
            <ul className="space-y-2">
              {INFINITE_FEATURES.map((f) => (
                <li
                  key={f.label}
                  className="flex items-start gap-2 text-xs"
                >
                  <f.icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center mt-4 space-y-3">
          <p className="text-2xl font-bold font-heading">
            $9.99<span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <Button
            className="w-full h-12 text-base rounded-full"
            onClick={() => {
              // TODO: Integrate payment
              onOpenChange(false);
            }}
          >
            <Infinity className="h-4 w-4 mr-2" />
            Go Infinite
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
