"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc/client";
import { useUser } from "@/hooks/use-user";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(2000).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().max(50).optional(),
  tags: z.string().optional(),
  clientName: z.string().max(100).optional(),
  projectUrl: z.string().url().optional().or(z.literal("")),
  layout: z.enum(["GRID", "MASONRY", "LIST"]),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  username,
}: CreateProjectModalProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const createProject = trpc.portfolio.createProject.useMutation({
    onSuccess: (newProject) => {
      toast.success("Project created successfully!");
      utils.portfolio.getProjectsByUsername.invalidate(username);
      onOpenChange(false);
      // Navigate to edit page to add content blocks
      router.push(`/portfolio/edit/${newProject.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      coverUrl: "",
      category: "",
      tags: "",
      clientName: "",
      projectUrl: "",
      layout: "GRID",
      isPublic: true,
      isFeatured: false,
    },
  });

  const isPublic = watch("isPublic");
  const isFeatured = watch("isFeatured");

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    const tags = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    createProject.mutate({
      ...data,
      tags,
      coverUrl: data.coverUrl || undefined,
      projectUrl: data.projectUrl || undefined,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Create Project</DialogTitle>
          <DialogDescription>
            Add a new project to your portfolio. You can add content blocks after creating.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <form id="create-project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Project Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="My Amazing Project"
                  disabled={isLoading}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Tell the story behind this project..."
                  {...register("description")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                {user?.id ? (
                  <ImageUpload
                    value={watch("coverUrl") || undefined}
                    onChange={(url) => setValue("coverUrl", url)}
                    onRemove={() => setValue("coverUrl", "")}
                    userId={user.id}
                    aspectRatio="video"
                  />
                ) : (
                  <div className="p-4 border rounded-lg bg-muted text-sm text-muted-foreground">
                    Loading...
                  </div>
                )}
              </div>
            </div>

            {/* Category & Client Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Organization
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="Web Design"
                    {...register("category")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    placeholder="Acme Inc."
                    {...register("clientName")}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="branding, logo, identity"
                  {...register("tags")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectUrl">External Project URL</Label>
                <Input
                  id="projectUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("projectUrl")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={watch("layout")}
                  onValueChange={(value) => setValue("layout", value as "GRID" | "MASONRY" | "LIST")}
                  disabled={isLoading}
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

            {/* Visibility Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Visibility
              </h3>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <div>
                    <Label htmlFor="isPublic">Public</Label>
                    <p className="text-xs text-muted-foreground">Anyone can view this project</p>
                  </div>
                </div>
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <div>
                    <Label htmlFor="isFeatured">Featured</Label>
                    <p className="text-xs text-muted-foreground">Highlight this project on your profile</p>
                  </div>
                </div>
                <Switch
                  id="isFeatured"
                  checked={isFeatured}
                  onCheckedChange={(checked) => setValue("isFeatured", checked)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
