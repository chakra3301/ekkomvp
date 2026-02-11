"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
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
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks/use-user";

const createCollectiveSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(500).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  joinType: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]),
});

type FormData = z.infer<typeof createCollectiveSchema>;

interface CreateCollectiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCollectiveModal({ open, onOpenChange }: CreateCollectiveModalProps) {
  const { user } = useUser();
  const utils = trpc.useUtils();
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(createCollectiveSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "PUBLIC",
      joinType: "OPEN",
    },
  });

  const createMutation = trpc.collective.create.useMutation({
    onSuccess: () => {
      toast.success("Collective created!");
      utils.collective.getAll.invalidate();
      utils.collective.getMyCollectives.invalidate();
      reset();
      setBannerUrl(undefined);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      ...data,
      bannerUrl: bannerUrl || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a Collective</DialogTitle>
          <DialogDescription>
            Start a community for creatives to collaborate and share work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My Creative Collective"
              {...register("name")}
              disabled={createMutation.isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What is this collective about?"
              {...register("description")}
              disabled={createMutation.isPending}
              rows={3}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Banner Image</Label>
            {user?.id && (
              <ImageUpload
                value={bannerUrl}
                onChange={(url) => setBannerUrl(url)}
                onRemove={() => setBannerUrl(undefined)}
                userId={user.id}
                aspectRatio="video"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={watch("visibility")}
                onValueChange={(v) => setValue("visibility", v as "PUBLIC" | "PRIVATE")}
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Join Type</Label>
              <Select
                value={watch("joinType")}
                onValueChange={(v) => setValue("joinType", v as "OPEN" | "REQUEST" | "INVITE_ONLY")}
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open to All</SelectItem>
                  <SelectItem value="REQUEST">Request to Join</SelectItem>
                  <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Collective
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
