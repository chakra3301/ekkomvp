"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tiers = [
  {
    key: "FREE" as const,
    name: "Free",
    price: "Free",
    features: [
      "Up to 5 portfolio projects",
      "4 images per post",
      "Basic profile",
    ],
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "$9.99/mo",
    popular: true,
    features: [
      "Up to 20 portfolio projects",
      "10 images per post",
      "Analytics dashboard",
      "Verified badge",
      "Custom accent color",
    ],
  },
  {
    key: "BUSINESS" as const,
    name: "Business",
    price: "$29.99/mo",
    features: [
      "Unlimited portfolio projects",
      "20 images per post",
      "Analytics dashboard",
      "Verified badge",
      "Custom accent color",
      "Priority support",
    ],
  },
];

export function UpgradeModal({ open, onOpenChange }: UpgradeModalProps) {
  const utils = trpc.useUtils();
  const { data: currentTier } = trpc.subscription.getCurrentTier.useQuery();

  const upgradeMutation = trpc.subscription.upgrade.useMutation({
    onSuccess: (data) => {
      utils.subscription.getCurrentTier.invalidate();
      utils.profile.getCurrent.invalidate();
      toast.success(`Upgraded to ${data.tier}! Payment integration coming soon.`);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to upgrade. Please try again.");
    },
  });

  const downgradeMutation = trpc.subscription.downgrade.useMutation({
    onSuccess: () => {
      utils.subscription.getCurrentTier.invalidate();
      utils.profile.getCurrent.invalidate();
      toast.success("Downgraded to Free plan.");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Choose your plan
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-3 mt-2">
          {tiers.map((tier) => {
            const isCurrent = currentTier?.tier === tier.key;
            return (
              <div
                key={tier.key}
                className={cn(
                  "relative p-4 rounded-lg border transition-all",
                  tier.popular && "border-primary shadow-sm",
                  isCurrent && "ring-2 ring-primary"
                )}
              >
                {tier.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="font-bold text-lg">{tier.name}</h3>
                <p className="text-2xl font-bold mt-1">{tier.price}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : tier.key === "FREE" ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downgradeMutation.mutate()}
                      disabled={downgradeMutation.isPending}
                    >
                      {downgradeMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => upgradeMutation.mutate(tier.key)}
                      disabled={upgradeMutation.isPending}
                    >
                      {upgradeMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Payment integration coming soon. Upgrades are currently instant for demo purposes.
        </p>
      </DialogContent>
    </Dialog>
  );
}
