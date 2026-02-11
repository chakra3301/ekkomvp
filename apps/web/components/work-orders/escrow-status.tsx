"use client";

import { Loader2, Shield, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

interface EscrowStatusProps {
  workOrderId: string;
  escrow: {
    id: string;
    totalAmount: number;
    fundedAmount: number;
    releasedAmount: number;
    status: string;
  } | null;
  isClient: boolean;
}

const steps = [
  { key: "PENDING", label: "Pending", icon: AlertCircle },
  { key: "FUNDED", label: "Funded", icon: Shield },
  { key: "RELEASED", label: "Released", icon: CheckCircle2 },
];

export function EscrowStatus({ workOrderId, escrow, isClient }: EscrowStatusProps) {
  const utils = trpc.useUtils();

  const fundMutation = trpc.workorder.fundEscrow.useMutation({
    onSuccess: () => {
      toast.success("Escrow funded!");
      utils.workorder.getById.invalidate(workOrderId);
    },
    onError: (error) => toast.error(error.message),
  });

  if (!escrow) return null;

  const currentStep = escrow.status === "RELEASED" || escrow.status === "REFUNDED"
    ? 2
    : escrow.status === "FUNDED" || escrow.status === "PARTIALLY_RELEASED"
      ? 1
      : 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Escrow</h3>
          {escrow.status === "REFUNDED" && (
            <span className="text-xs text-red-500 font-medium ml-auto">Refunded</span>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1">
          {steps.map((step, i) => {
            const isActive = i <= currentStep;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs mt-1 ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="font-semibold">${escrow.totalAmount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Funded</p>
            <p className="font-semibold">${escrow.fundedAmount}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Released</p>
            <p className="font-semibold">${escrow.releasedAmount}</p>
          </div>
        </div>

        {/* Fund button */}
        {isClient && escrow.status === "PENDING" && (
          <Button
            className="w-full"
            onClick={() => fundMutation.mutate(workOrderId)}
            disabled={fundMutation.isPending}
          >
            {fundMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Fund Escrow (${escrow.totalAmount})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
