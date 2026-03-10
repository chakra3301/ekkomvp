"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Infinity,
  Sparkles,
  Eye,
  Globe,
  Zap,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { purchaseInfinite, restorePurchases } from "@/lib/purchases";

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
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const upgradeTier = trpc.connectProfile.upgradeTier.useMutation();
  const utils = trpc.useUtils();
  const isNative = Capacitor.isNativePlatform();

  const handlePurchase = async () => {
    if (!isNative) {
      toast.info("Subscriptions are available in the iOS app");
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchaseInfinite();

      if (result.success) {
        // Sync tier to backend
        await upgradeTier.mutateAsync("INFINITE");
        await utils.connectProfile.getCurrent.invalidate();
        toast.success("Welcome to Infinite!");
        onOpenChange(false);
      } else if (result.error === "cancelled") {
        // User cancelled — do nothing
      } else {
        toast.error(result.error || "Purchase failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        await upgradeTier.mutateAsync("INFINITE");
        await utils.connectProfile.getCurrent.invalidate();
        toast.success("Subscription restored!");
        onOpenChange(false);
      } else {
        toast.info("No active subscription found");
      }
    } catch {
      toast.error("Failed to restore purchases");
    } finally {
      setRestoring(false);
    }
  };

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
          {/* Subscription details — required by Apple */}
          <div>
            <p className="text-2xl font-bold font-heading">
              $9.99
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              EKKO Connect Infinite — auto-renewable monthly subscription.
              {"\n"}Payment will be charged to your Apple ID account at
              confirmation. Subscription automatically renews unless cancelled at
              least 24 hours before the end of the current period.
            </p>
          </div>

          <Button
            className="w-full h-12 text-base rounded-full"
            onClick={handlePurchase}
            disabled={purchasing || restoring}
          >
            {purchasing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Infinity className="h-4 w-4 mr-2" />
                {isNative ? "Subscribe" : "Available on iOS"}
              </>
            )}
          </Button>

          {/* Restore purchases — required by Apple */}
          {isNative && (
            <button
              onClick={handleRestore}
              disabled={restoring || purchasing}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
            >
              {restoring ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Restore Purchases
            </button>
          )}

          <button
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </button>

          {/* Terms + Privacy links — required by Apple */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <Link href="/terms" className="hover:underline">
              Terms of Use
            </Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
