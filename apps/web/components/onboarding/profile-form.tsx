"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, Camera } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { uploadAvatar } from "@/lib/supabase/storage";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters"),
  headline: z
    .string()
    .max(100, "Headline must be at most 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  location: z.string().max(100, "Location must be at most 100 characters").optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "NOT_AVAILABLE"]).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface OnboardingProfileFormProps {
  userId: string;
  userRole: string;
}

export function OnboardingProfileForm({
  userId,
  userRole,
}: OnboardingProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: async () => {
      // If avatar was uploaded, save it
      if (avatarUrl) {
        try {
          await updateAvatarMutation.mutateAsync({ avatarUrl });
        } catch {
          // Non-critical, continue
        }
      }
      toast.success("Profile created successfully!");
      if (userRole === "CREATIVE") {
        router.push("/onboarding/skills");
      } else {
        router.push("/onboarding/follows");
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setIsLoading(false);
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be less than 2MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarUrl(url);
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      availability: "AVAILABLE",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    updateProfile.mutate({
      ...data,
      headline: data.headline || null,
      bio: data.bio || null,
      location: data.location || null,
    });
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading">
          Complete Your Profile
        </CardTitle>
        <CardDescription>
          Tell us about yourself so others can find and connect with you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary transition-colors">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {avatarUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={avatarUploading || isLoading}
              />
              <span className="block text-center text-xs text-muted-foreground mt-1">
                Add photo
              </span>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="johndoe"
                disabled={isLoading}
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This will be your profile URL: ekko.co/
                <span className="font-medium">username</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="John Doe"
                disabled={isLoading}
                {...register("displayName")}
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
              placeholder={
                userRole === "CREATIVE"
                  ? "e.g., Senior Motion Designer | 3D Artist"
                  : "e.g., Creative Director at Agency X"
              }
              disabled={isLoading}
              {...register("headline")}
            />
            {errors.headline && (
              <p className="text-sm text-destructive">
                {errors.headline.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself, your experience, and what you're passionate about..."
              rows={4}
              disabled={isLoading}
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY or Remote"
                disabled={isLoading}
                {...register("location")}
              />
              {errors.location && (
                <p className="text-sm text-destructive">
                  {errors.location.message}
                </p>
              )}
            </div>

            {userRole === "CREATIVE" && (
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Select
                  defaultValue="AVAILABLE"
                  onValueChange={(value) =>
                    setValue(
                      "availability",
                      value as "AVAILABLE" | "BUSY" | "NOT_AVAILABLE"
                    )
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="availability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">
                      Available for work
                    </SelectItem>
                    <SelectItem value="BUSY">
                      Busy, but open to offers
                    </SelectItem>
                    <SelectItem value="NOT_AVAILABLE">
                      Not available
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-4 w-4" />
            )}
            {userRole === "CREATIVE" ? "Continue to Skills" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
