"use client";

import { useState } from "react";
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
import { trpc } from "@/lib/trpc/client";

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
  country: z.string().max(100).optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  tiktokUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  hourlyRateMin: z.number().min(0).max(10000).optional().nullable(),
  hourlyRateMax: z.number().min(0).max(10000).optional().nullable(),
  availability: z.enum(["AVAILABLE", "BUSY", "NOT_AVAILABLE"]).optional(),
  companyName: z.string().max(100).optional().nullable(),
  companyDescription: z.string().max(500).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  profile: {
    username: string;
    displayName: string;
    headline?: string | null;
    bio?: string | null;
    location?: string | null;
    country?: string | null;
    website?: string | null;
    instagramUrl?: string | null;
    twitterUrl?: string | null;
    tiktokUrl?: string | null;
    hourlyRateMin?: number | null;
    hourlyRateMax?: number | null;
    availability?: string | null;
    companyName?: string | null;
    companyDescription?: string | null;
    industry?: string | null;
  };
  userRole: string;
}

export function ProfileEditForm({ profile, userRole }: ProfileEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      router.push("/profile");
      router.refresh();
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
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      location: profile.location,
      country: profile.country,
      website: profile.website || "",
      instagramUrl: profile.instagramUrl || "",
      twitterUrl: profile.twitterUrl || "",
      tiktokUrl: profile.tiktokUrl || "",
      hourlyRateMin: profile.hourlyRateMin,
      hourlyRateMax: profile.hourlyRateMax,
      availability: (profile.availability as "AVAILABLE" | "BUSY" | "NOT_AVAILABLE") || "AVAILABLE",
      companyName: profile.companyName,
      companyDescription: profile.companyDescription,
      industry: profile.industry,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    updateProfile.mutate(data);
  };

  const isCreative = userRole === "CREATIVE";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            This information will be displayed on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              rows={4}
              placeholder="Tell others about yourself..."
              {...register("bio")}
              disabled={isLoading}
            />
            {errors.bio && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location & Work */}
      <Card>
        <CardHeader>
          <CardTitle>Location & Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">City/Location</Label>
              <Input
                id="location"
                placeholder="e.g., New York, NY"
                {...register("location")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g., United States"
                {...register("country")}
                disabled={isLoading}
              />
            </div>
          </div>

          {isCreative && (
            <>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMin">Minimum Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRateMin"
                    type="number"
                    min={0}
                    max={10000}
                    placeholder="e.g., 50"
                    {...register("hourlyRateMin", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRateMax">Maximum Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRateMax"
                    type="number"
                    min={0}
                    max={10000}
                    placeholder="e.g., 150"
                    {...register("hourlyRateMax", { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </>
          )}

          {!isCreative && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Your company or organization"
                  {...register("companyName")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Marketing, Tech, Entertainment"
                  {...register("industry")}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  rows={3}
                  placeholder="Brief description of your company..."
                  {...register("companyDescription")}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Connect your website and social profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              {...register("website")}
              disabled={isLoading}
            />
            {errors.website && (
              <p className="text-sm text-destructive">
                {errors.website.message}
              </p>
            )}
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
            {errors.instagramUrl && (
              <p className="text-sm text-destructive">
                {errors.instagramUrl.message}
              </p>
            )}
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
            {errors.twitterUrl && (
              <p className="text-sm text-destructive">
                {errors.twitterUrl.message}
              </p>
            )}
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
            {errors.tiktokUrl && (
              <p className="text-sm text-destructive">
                {errors.tiktokUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
