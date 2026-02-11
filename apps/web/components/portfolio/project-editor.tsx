"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Type,
  Video,
  Music,
  Box,
  Code,
  Minus,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ui/image-upload";
import { useUser } from "@/hooks/use-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { BlockEditor } from "./block-editor";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(2000).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().max(50).optional(),
  tags: z.string().optional(), // comma-separated
  clientName: z.string().max(100).optional(),
  projectUrl: z.string().url().optional().or(z.literal("")),
  layout: z.enum(["GRID", "MASONRY", "LIST"]),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isNew?: boolean;
}

interface ProjectEditorProps {
  project?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverUrl?: string | null;
    category?: string | null;
    tags: string[];
    clientName?: string | null;
    projectUrl?: string | null;
    layout: string;
    isPublic: boolean;
    isFeatured: boolean;
    blocks: Array<{
      id: string;
      type: string;
      content: unknown;
      sortOrder: number;
    }>;
  };
}

const BLOCK_TYPES = [
  { type: "TEXT", label: "Text", icon: Type },
  { type: "IMAGE", label: "Image", icon: ImageIcon },
  { type: "IMAGE_GALLERY", label: "Gallery", icon: ImageIcon },
  { type: "VIDEO", label: "Video File", icon: Video },
  { type: "VIDEO_EMBED", label: "Video Embed", icon: Video },
  { type: "AUDIO", label: "Audio", icon: Music },
  { type: "MODEL_3D", label: "3D Model", icon: Box },
  { type: "EMBED", label: "Embed", icon: Code },
  { type: "DIVIDER", label: "Divider", icon: Minus },
];

export function ProjectEditor({ project }: ProjectEditorProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { user } = useUser();
  const [blocks, setBlocks] = useState<Block[]>(
    project?.blocks.map((b) => ({
      ...b,
      content: b.content as Record<string, unknown>,
    })) || []
  );
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      coverUrl: project?.coverUrl || "",
      category: project?.category || "",
      tags: project?.tags.join(", ") || "",
      clientName: project?.clientName || "",
      projectUrl: project?.projectUrl || "",
      layout: (project?.layout as "GRID" | "MASONRY" | "LIST") || "GRID",
      isPublic: project?.isPublic ?? true,
      isFeatured: project?.isFeatured ?? false,
    },
  });

  const isPublic = watch("isPublic");
  const isFeatured = watch("isFeatured");

  const createProject = trpc.portfolio.createProject.useMutation({
    onSuccess: async (newProject) => {
      // Add blocks to the new project
      for (const block of blocks) {
        await addBlockMutation.mutateAsync({
          projectId: newProject.id,
          type: block.type as any,
          content: block.content,
        });
      }
      utils.portfolio.getMyProjects.invalidate();
      router.push("/profile");
    },
  });

  const updateProject = trpc.portfolio.updateProject.useMutation({
    onSuccess: () => {
      utils.portfolio.getMyProjects.invalidate();
      router.push("/profile");
    },
  });

  const addBlockMutation = trpc.portfolio.addBlock.useMutation();
  const updateBlockMutation = trpc.portfolio.updateBlock.useMutation();
  const deleteBlockMutation = trpc.portfolio.deleteBlock.useMutation();

  const onSubmit = async (data: ProjectFormData) => {
    const tags = data.tags
      ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    if (project) {
      // Update existing project
      await updateProject.mutateAsync({
        id: project.id,
        ...data,
        tags,
        coverUrl: data.coverUrl || null,
        projectUrl: data.projectUrl || null,
      });

      // Handle block changes
      for (const block of blocks) {
        if (block.isNew) {
          await addBlockMutation.mutateAsync({
            projectId: project.id,
            type: block.type as any,
            content: block.content,
          });
        } else {
          await updateBlockMutation.mutateAsync({
            id: block.id,
            content: block.content,
          });
        }
      }
    } else {
      // Create new project
      await createProject.mutateAsync({
        ...data,
        tags,
        coverUrl: data.coverUrl || undefined,
        projectUrl: data.projectUrl || undefined,
      });
    }
  };

  const addBlock = (type: string) => {
    const newBlock: Block = {
      id: `new-${Date.now()}`,
      type,
      content: {},
      sortOrder: blocks.length,
      isNew: true,
    };
    setBlocks([...blocks, newBlock]);
    setShowBlockPicker(false);
    setEditingBlock(newBlock);
  };

  const updateBlock = (id: string, content: Record<string, unknown>) => {
    setBlocks(
      blocks.map((b) => (b.id === id ? { ...b, content } : b))
    );
    setEditingBlock(null);
  };

  const removeBlock = async (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (block && !block.isNew && project) {
      await deleteBlockMutation.mutateAsync(id);
    }
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, sortOrder: i })));
  };

  const isLoading = createProject.isPending || updateProject.isPending;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="My Amazing Project"
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Tell the story behind this project..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Cover Image</Label>
            {user?.id ? (
              <ImageUpload
                value={watch("coverUrl") || undefined}
                onChange={(url) => setValue("coverUrl", url)}
                onRemove={() => setValue("coverUrl", "")}
                userId={user.id}
                className="mt-1"
                aspectRatio="video"
              />
            ) : (
              <div className="mt-1 p-4 border rounded-lg bg-muted text-sm text-muted-foreground">
                Loading...
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="Web Design"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                {...register("clientName")}
                placeholder="Acme Inc."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="branding, logo, identity"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="projectUrl">External Project URL</Label>
            <Input
              id="projectUrl"
              {...register("projectUrl")}
              placeholder="https://..."
              className="mt-1"
            />
          </div>

          <div>
            <Label>Layout</Label>
            <Select
              value={watch("layout")}
              onValueChange={(value) => setValue("layout", value as any)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GRID">Grid</SelectItem>
                <SelectItem value="MASONRY">Masonry</SelectItem>
                <SelectItem value="LIST">List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <Label htmlFor="isPublic">Public</Label>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
            <Switch
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={(checked) => setValue("isFeatured", checked)}
            />
          </div>
        </div>

        {/* Content Blocks */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Content Blocks</h3>
            <Dialog open={showBlockPicker} onOpenChange={setShowBlockPicker}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Block
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Content Block</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {BLOCK_TYPES.map((blockType) => (
                    <button
                      key={blockType.type}
                      type="button"
                      onClick={() => addBlock(blockType.type)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <blockType.icon className="h-6 w-6" />
                      <span className="text-sm">{blockType.label}</span>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {blocks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No content blocks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add blocks to build your project showcase
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, index) => {
                const blockType = BLOCK_TYPES.find((t) => t.type === block.type);
                const Icon = blockType?.icon || Type;

                return (
                  <div
                    key={block.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, "down")}
                        disabled={index === blocks.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {blockType?.label || block.type}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {JSON.stringify(block.content).slice(0, 50)}...
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingBlock(block)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {project ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </form>

      {/* Block Editor Dialog */}
      {editingBlock && (
        <BlockEditor
          block={editingBlock}
          onSave={(content) => updateBlock(editingBlock.id, content)}
          onClose={() => setEditingBlock(null)}
          userId={user?.id}
        />
      )}
    </div>
  );
}
