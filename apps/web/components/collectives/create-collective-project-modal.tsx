"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks/use-user";

interface CreateCollectiveProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectiveId: string;
  collectiveSlug: string;
}

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  layout: z.enum(["GRID", "MASONRY", "LIST"]).default("GRID"),
});

export function CreateCollectiveProjectModal({
  open,
  onOpenChange,
  collectiveId,
  collectiveSlug: _collectiveSlug,
}: CreateCollectiveProjectModalProps) {
  const { user } = useUser();
  const utils = trpc.useUtils();
  const [coverUrl, setCoverUrl] = useState<string | undefined>();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      layout: "GRID" as const,
    },
  });

  const createMutation = trpc.collective.createCollectiveProject.useMutation({
    onSuccess: () => {
      toast.success("Project created!");
      utils.collective.getCollectiveProjects.invalidate();
      reset();
      setCoverUrl(undefined);
      setTags([]);
      setTagInput("");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      collectiveId,
      title: data.title,
      description: data.description || undefined,
      coverUrl: coverUrl || undefined,
      category: data.category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      layout: data.layout,
    });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 15) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      setCoverUrl(undefined);
      setTags([]);
      setTagInput("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Portfolio Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Title</Label>
            <Input
              id="project-title"
              placeholder="Project title"
              {...register("title")}
              disabled={createMutation.isPending}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of this project"
              {...register("description")}
              disabled={createMutation.isPending}
              rows={3}
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {user?.id && (
              <ImageUpload
                value={coverUrl}
                onChange={(url) => setCoverUrl(url)}
                onRemove={() => setCoverUrl(undefined)}
                userId={user.id}
                aspectRatio="video"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-category">Category</Label>
              <Input
                id="project-category"
                placeholder="e.g. Design, Music"
                {...register("category")}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={watch("layout")}
                onValueChange={(v) => setValue("layout", v as any)}
                disabled={createMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRID">Grid</SelectItem>
                  <SelectItem value="MASONRY">Masonry</SelectItem>
                  <SelectItem value="LIST">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={createMutation.isPending || tags.length >= 15}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 15}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">{tags.length}/15 tags</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
