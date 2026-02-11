"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc/client";

type TargetType = "POST" | "USER" | "COLLECTIVE" | "COMMENT";

const REASONS = [
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "VIOLENCE", label: "Violence" },
  { value: "NSFW", label: "Inappropriate content" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "OTHER", label: "Other" },
] as const;

interface ReportDialogProps {
  targetType: TargetType;
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ targetType, targetId, open, onOpenChange }: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");

  const reportMutation = trpc.report.create.useMutation({
    onSuccess: () => {
      toast.success("Report submitted. Thank you for helping keep EKKO safe.");
      onOpenChange(false);
      setReason("");
      setDescription("");
    },
    onError: () => {
      toast.error("Failed to submit report. Please try again.");
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }
    reportMutation.mutate({
      targetType: targetType as "POST" | "USER" | "COLLECTIVE" | "COMMENT",
      targetId,
      reason: reason as "SPAM" | "HARASSMENT" | "HATE_SPEECH" | "VIOLENCE" | "NSFW" | "IMPERSONATION" | "OTHER",
      description: description.trim() || undefined,
    });
  };

  const targetLabel = targetType.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Report {targetLabel}
          </DialogTitle>
          <DialogDescription>
            Help us understand what&apos;s wrong with this {targetLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={setReason}>
            {REASONS.map((r) => (
              <div key={r.value} className="flex items-center space-x-2">
                <RadioGroupItem value={r.value} id={r.value} />
                <Label htmlFor={r.value} className="cursor-pointer">
                  {r.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div>
            <Label htmlFor="description" className="text-sm text-muted-foreground">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Tell us more about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
          >
            {reportMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
