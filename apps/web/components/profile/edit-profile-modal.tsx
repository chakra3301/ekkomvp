"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColorPicker } from "@/components/ui/color-picker";
import { BackgroundEditor } from "@/components/profile/background-editor";
import { uploadAvatar, uploadBanner } from "@/lib/supabase/storage";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  headline: z
    .string()
    .max(100, "Headline must be at most 100 characters")
    .optional()
    .nullable(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  tiktokUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  hourlyRateMin: z.number().min(0).max(10000).optional().nullable(),
  hourlyRateMax: z.number().min(0).max(10000).optional().nullable(),
  availability: z.enum(["AVAILABLE", "BUSY", "NOT_AVAILABLE"]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    username: string;
    displayName: string;
    headline?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    location?: string | null;
    website?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    tiktokUrl?: string | null;
    hourlyRateMin?: number | null;
    hourlyRateMax?: number | null;
    availability?: string | null;
    accentColor?: string | null;
    pageBackground?: { type: "solid" | "gradient" | "image"; value: string } | null;
    user: {
      id: string;
    };
  };
  userRole: string;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  userRole,
}: EditProfileModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "");
  const [bannerPreview, setBannerPreview] = useState(profile.bannerUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [accentColor, setAccentColor] = useState<string | null>(profile.accentColor || null);
  const [pageBackground, setPageBackground] = useState<{ type: "solid" | "gradient" | "image"; value: string } | null>(
    (profile.pageBackground as { type: "solid" | "gradient" | "image"; value: string } | null) || null
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation({
    onSuccess: () => router.refresh(),
  });

  const updateBannerMutation = trpc.profile.updateBanner.useMutation({
    onSuccess: () => router.refresh(),
  });

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(profile.user.id, file);
      setAvatarPreview(url);
      updateAvatarMutation.mutate({ avatarUrl: url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [profile.user.id, updateAvatarMutation]);

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    setIsUploadingBanner(true);
    try {
      const url = await uploadBanner(profile.user.id, file);
      setBannerPreview(url);
      updateBannerMutation.mutate({ bannerUrl: url });
      toast.success("Banner updated!");
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
    }
  }, [profile.user.id, updateBannerMutation]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      website: profile.website || "",
      instagramUrl: profile.instagramUrl || "",
      twitterUrl: profile.twitterUrl || "",
      tiktokUrl: profile.tiktokUrl || "",
      hourlyRateMin: profile.hourlyRateMin,
      hourlyRateMax: profile.hourlyRateMax,
      availability: (profile.availability as "AVAILABLE" | "BUSY" | "NOT_AVAILABLE") || "AVAILABLE",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    updateProfile.mutate({
      ...data,
      accentColor,
      pageBackground,
    });
  };

  const isCreative = userRole === "CREATIVE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Changes will be visible immediately.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
            {/* Avatar & Banner */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Photos
              </h3>

              {/* Banner */}
              <div>
                <Label>Banner Image</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recommended: 1500 × 500 px (3:1 ratio)
                </p>
                <div
                  className="relative mt-1 h-32 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20 cursor-pointer group"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {bannerPreview && (
                    <Image src={bannerPreview} alt="Banner" fill className="object-cover" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                    {isUploadingBanner ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                </div>
              </div>

              {/* Avatar */}
              <div>
                <Label>Profile Photo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recommended: 400 × 400 px (square)
                </p>
                <div className="mt-1 flex items-center gap-4">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {getInitials(profile.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      {isUploadingAvatar ? (
                        <Loader2 className="h-5 w-5 text-white animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to upload. JPG, PNG up to 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    {...register("username")}
                    disabled={isLoading}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...register("displayName")}
                    disabled={isLoading}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive">
                      {errors.displayName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  placeholder="e.g., Senior Motion Designer | 3D Artist"
                  {...register("headline")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell others about yourself..."
                  {...register("bio")}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Location & Availability Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Location & Work
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., New York, NY"
                    {...register("location")}
                    disabled={isLoading}
                  />
                </div>

                {isCreative && (
                  <div className="space-y-2">
                    <Label htmlFor="availability">Availability</Label>
                    <Select
                      defaultValue={watch("availability") || "AVAILABLE"}
                      onValueChange={(value) =>
                        setValue(
                          "availability",
                          value as "AVAILABLE" | "BUSY" | "NOT_AVAILABLE"
                        )
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger id="availability">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available for work</SelectItem>
                        <SelectItem value="BUSY">Busy, but open to offers</SelectItem>
                        <SelectItem value="NOT_AVAILABLE">Not available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {isCreative && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRateMin">Min Rate ($/hr)</Label>
                    <Input
                      id="hourlyRateMin"
                      type="number"
                      min={0}
                      placeholder="e.g., 50"
                      {...register("hourlyRateMin", { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRateMax">Max Rate ($/hr)</Label>
                    <Input
                      id="hourlyRateMax"
                      type="number"
                      min={0}
                      placeholder="e.g., 150"
                      {...register("hourlyRateMax", { valueAsNumber: true })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Links Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Links
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    {...register("website")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/username"
                    {...register("instagramUrl")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">X (Twitter)</Label>
                  <Input
                    id="twitterUrl"
                    type="url"
                    placeholder="https://x.com/username"
                    {...register("twitterUrl")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktokUrl">TikTok</Label>
                  <Input
                    id="tiktokUrl"
                    type="url"
                    placeholder="https://tiktok.com/@username"
                    {...register("tiktokUrl")}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Profile Customization Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Profile Customization
              </h3>

              {/* Accent Color */}
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <p className="text-xs text-muted-foreground">
                  Visitors will see your profile in this color
                </p>
                {accentColor ? (
                  <div className="space-y-2">
                    <ColorPicker
                      color={accentColor}
                      onChange={setAccentColor}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setAccentColor(null)}
                    >
                      Reset to default
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAccentColor("#8B5CF6")}
                  >
                    Set custom color
                  </Button>
                )}
              </div>

              {/* Page Background */}
              <div className="space-y-2">
                <Label>Page Background</Label>
                <p className="text-xs text-muted-foreground">
                  Customize the background of your profile page. For image: 1920 × 1080 px or larger.
                </p>
                <BackgroundEditor
                  value={pageBackground}
                  onChange={setPageBackground}
                  userId={profile.user.id}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
