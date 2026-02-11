"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";

const applySchema = z.object({
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters").max(1000),
  proposedRate: z.number().min(0).optional().nullable(),
  timeline: z.string().max(200).optional().nullable(),
});

type ApplyFormData = z.infer<typeof applySchema>;

interface ApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
}

export function ApplyModal({ open, onOpenChange, projectId, projectTitle }: ApplyModalProps) {
  const utils = trpc.useUtils();

  const applyMutation = trpc.application.submit.useMutation({
    onSuccess: () => {
      toast.success("Application submitted!");
      onOpenChange(false);
      utils.project.getById.invalidate(projectId);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
  });

  const onSubmit = (data: ApplyFormData) => {
    applyMutation.mutate({
      projectId,
      coverLetter: data.coverLetter,
      proposedRate: data.proposedRate,
      timeline: data.timeline,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to Gig</DialogTitle>
          <DialogDescription>
            Submit your application for &ldquo;{projectTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <form id="apply-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              rows={5}
              placeholder="Tell the client why you're a great fit for this project..."
              {...register("coverLetter")}
              disabled={applyMutation.isPending}
            />
            {errors.coverLetter && (
              <p className="text-sm text-destructive">{errors.coverLetter.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposedRate">Your Rate ($)</Label>
              <Input
                id="proposedRate"
                type="number"
                min={0}
                placeholder="e.g., 1000"
                {...register("proposedRate", { valueAsNumber: true })}
                disabled={applyMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Estimated Timeline</Label>
              <Input
                id="timeline"
                placeholder="e.g., 2 weeks"
                {...register("timeline")}
                disabled={applyMutation.isPending}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={applyMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="apply-form" disabled={applyMutation.isPending}>
            {applyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
