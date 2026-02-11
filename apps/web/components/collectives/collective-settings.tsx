"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { RoleManager } from "./role-manager";
import { PendingRequestsList } from "./pending-requests-list";

interface CollectiveSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectiveId: string;
  collectiveSlug: string;
  creatorId: string;
  userId?: string;
}

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(500).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  joinType: z.enum(["OPEN", "REQUEST", "INVITE_ONLY"]).optional(),
});

type Tab = "general" | "roles" | "requests" | "danger";

export function CollectiveSettingsModal({
  open,
  onOpenChange,
  collectiveId,
  collectiveSlug,
  creatorId,
  userId,
}: CollectiveSettingsModalProps) {
  const router = useRouter();
  const { user: authUser } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerDirty, setBannerDirty] = useState(false);

  const { data: collective } = trpc.collective.getBySlug.useQuery(collectiveSlug);

  useEffect(() => {
    if (collective && !bannerDirty) {
      setBannerUrl(collective.bannerUrl || null);
    }
  }, [collective, bannerDirty]);

  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateSchema),
    values: collective
      ? {
          name: collective.name,
          description: collective.description || "",
          visibility: collective.visibility as "PUBLIC" | "PRIVATE",
          joinType: collective.joinType as "OPEN" | "REQUEST" | "INVITE_ONLY",
        }
      : undefined,
  });

  const updateMutation = trpc.collective.update.useMutation({
    onSuccess: (data) => {
      toast.success("Settings updated!");
      utils.collective.getBySlug.invalidate(collectiveSlug);
      utils.collective.getAll.invalidate();
      if (data.slug !== collectiveSlug) {
        onOpenChange(false);
        router.replace(`/collectives/${data.slug}`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.collective.delete.useMutation({
    onSuccess: () => {
      toast.success("Collective deleted");
      onOpenChange(false);
      router.push("/collectives");
    },
    onError: (err) => toast.error(err.message),
  });

  const isCreator = userId === creatorId;

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      collectiveId,
      ...data,
      ...(bannerDirty ? { bannerUrl: bannerUrl || null } : {}),
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "roles", label: "Roles" },
    { id: "requests", label: "Requests" },
    ...(isCreator ? [{ id: "danger" as Tab, label: "Danger Zone" }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b border-border px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "general" && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} disabled={updateMutation.isPending} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  disabled={updateMutation.isPending}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Banner Image</Label>
                {authUser?.id && (
                  <ImageUpload
                    value={bannerUrl || undefined}
                    onChange={(url) => {
                      setBannerUrl(url);
                      setBannerDirty(true);
                    }}
                    onRemove={() => {
                      setBannerUrl(null);
                      setBannerDirty(true);
                    }}
                    userId={authUser.id}
                    aspectRatio="video"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    value={watch("visibility")}
                    onValueChange={(v) => setValue("visibility", v as any, { shouldDirty: true })}
                    disabled={updateMutation.isPending}
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
                    onValueChange={(v) => setValue("joinType", v as any, { shouldDirty: true })}
                    disabled={updateMutation.isPending}
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

              <Button type="submit" disabled={updateMutation.isPending || (!isDirty && !bannerDirty)}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </form>
          )}

          {activeTab === "roles" && (
            <RoleManager collectiveId={collectiveId} />
          )}

          {activeTab === "requests" && (
            <PendingRequestsList
              collectiveId={collectiveId}
              collectiveSlug={collectiveSlug}
            />
          )}

          {activeTab === "danger" && isCreator && (
            <div className="border border-destructive/50 rounded-lg p-4">
              <h3 className="font-semibold text-destructive">Delete Collective</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This action is permanent and cannot be undone. All posts, members, and portfolio
                projects will be deleted.
              </p>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this collective? This cannot be undone.")) {
                    deleteMutation.mutate(collectiveId);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Collective
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
