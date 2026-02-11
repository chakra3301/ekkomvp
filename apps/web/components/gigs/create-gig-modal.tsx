"use client";

import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";

const createGigSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  budgetType: z.enum(["FIXED", "HOURLY", "MILESTONE"]),
  budgetMin: z.number().min(0).optional().nullable(),
  budgetMax: z.number().min(0).optional().nullable(),
  duration: z.string().max(100).optional().nullable(),
  locationType: z.enum(["REMOTE", "ONSITE", "HYBRID"]),
  location: z.string().max(200).optional().nullable(),
  deadline: z.string().optional().nullable(),
  skillsNeeded: z.string().optional(),
});

type CreateGigFormData = z.infer<typeof createGigSchema>;

interface CreateGigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDirect?: boolean;
  targetCreativeId?: string;
  targetCreativeName?: string;
}

export function CreateGigModal({
  open,
  onOpenChange,
  isDirect = false,
  targetCreativeId,
  targetCreativeName,
}: CreateGigModalProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      toast.success(isDirect ? "Work request sent!" : "Gig posted successfully!");
      onOpenChange(false);
      utils.project.getAll.invalidate();
      if (!isDirect) {
        router.push("/gigs");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGigFormData>({
    resolver: zodResolver(createGigSchema),
    defaultValues: {
      budgetType: "FIXED",
      locationType: "REMOTE",
    },
  });

  const onSubmit = async (data: CreateGigFormData) => {
    const skills = data.skillsNeeded
      ? data.skillsNeeded.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    createProject.mutate({
      title: data.title,
      description: data.description,
      budgetType: data.budgetType,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      duration: data.duration,
      locationType: data.locationType,
      location: data.location,
      deadline: data.deadline || null,
      skillsNeeded: skills,
      isDirect,
      targetCreativeId: targetCreativeId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            {isDirect ? `Send Work Request${targetCreativeName ? ` to ${targetCreativeName}` : ""}` : "Post a Gig"}
          </DialogTitle>
          <DialogDescription>
            {isDirect
              ? "Describe the work you need done and your budget."
              : "Post a gig for creatives to apply to."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <form id="create-gig-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Logo Design for Tech Startup"
                  {...register("title")}
                  disabled={createProject.isPending}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe what you need, deliverables, and any specific requirements..."
                  {...register("description")}
                  disabled={createProject.isPending}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Budget
              </h3>
              <div className="space-y-2">
                <Label htmlFor="budgetType">Pricing Model</Label>
                <Select
                  defaultValue="FIXED"
                  onValueChange={(v) => setValue("budgetType", v as "FIXED" | "HOURLY" | "MILESTONE")}
                  disabled={createProject.isPending}
                >
                  <SelectTrigger id="budgetType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed Price</SelectItem>
                    <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                    <SelectItem value="MILESTONE">Milestone-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">
                    {watch("budgetType") === "HOURLY" ? "Min Rate ($/hr)" : "Min Budget ($)"}
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    min={0}
                    placeholder="e.g., 500"
                    {...register("budgetMin", { valueAsNumber: true })}
                    disabled={createProject.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">
                    {watch("budgetType") === "HOURLY" ? "Max Rate ($/hr)" : "Max Budget ($)"}
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    min={0}
                    placeholder="e.g., 2000"
                    {...register("budgetMax", { valueAsNumber: true })}
                    disabled={createProject.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locationType">Location</Label>
                  <Select
                    defaultValue="REMOTE"
                    onValueChange={(v) => setValue("locationType", v as "REMOTE" | "ONSITE" | "HYBRID")}
                    disabled={createProject.isPending}
                  >
                    <SelectTrigger id="locationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Remote</SelectItem>
                      <SelectItem value="ONSITE">On-site</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...register("deadline")}
                    disabled={createProject.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 2-4 weeks"
                  {...register("duration")}
                  disabled={createProject.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillsNeeded">Skills Needed</Label>
                <Input
                  id="skillsNeeded"
                  placeholder="e.g., Logo Design, Branding, Illustration (comma-separated)"
                  {...register("skillsNeeded")}
                  disabled={createProject.isPending}
                />
                <p className="text-xs text-muted-foreground">Separate skills with commas</p>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={createProject.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-gig-form" disabled={createProject.isPending}>
            {createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDirect ? "Send Request" : "Post Gig"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
