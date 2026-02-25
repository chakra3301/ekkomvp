"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Instagram, Globe } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CONNECT_LIMITS } from "@ekko/config";

import {
  MediaSlotGrid,
  type MediaSlot,
} from "@/components/connect/media-slot-grid";
import {
  PromptEditor,
  type PromptEntry,
} from "@/components/connect/prompt-editor";
import { ConnectProfileCard } from "@/components/connect/connect-profile-card";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const steps = ["Media", "Prompts", "Details", "Preview"];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, profile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>([]);
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [headline, setHeadline] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState(profile?.location || "");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const { data: existingProfile, isLoading: profileLoading } =
    trpc.connectProfile.getCurrent.useQuery(undefined, { enabled: !!user });

  const createProfile = trpc.connectProfile.create.useMutation();
  const updateProfile = trpc.connectProfile.update.useMutation();
  const utils = trpc.useUtils();

  const isEditing = !!existingProfile;

  // Pre-populate form when editing an existing profile
  useEffect(() => {
    if (existingProfile && !initialized) {
      setMediaSlots(
        (existingProfile.mediaSlots as unknown as MediaSlot[]) || []
      );
      setPrompts(
        (existingProfile.prompts as unknown as PromptEntry[]) || []
      );
      setHeadline(existingProfile.headline || "");
      setLookingFor(existingProfile.lookingFor || "");
      setBio(existingProfile.bio || "");
      setLocation(existingProfile.location || "");
      setInstagramHandle(existingProfile.instagramHandle || "");
      setTwitterHandle(existingProfile.twitterHandle || "");
      setWebsiteUrl(existingProfile.websiteUrl || "");
      setInitialized(true);
    }
  }, [existingProfile, initialized]);

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return mediaSlots.length >= CONNECT_LIMITS.MIN_MEDIA_SLOTS;
      case 1:
        return (
          prompts.length >= CONNECT_LIMITS.MIN_PROMPTS &&
          prompts.every((p) => p.answer.trim().length > 0)
        );
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const payload = {
      headline: headline || undefined,
      lookingFor: lookingFor || undefined,
      bio: bio || undefined,
      mediaSlots,
      prompts,
      instagramHandle: instagramHandle || undefined,
      twitterHandle: twitterHandle || undefined,
      websiteUrl: websiteUrl || undefined,
      location: location || undefined,
    };

    try {
      if (isEditing) {
        await updateProfile.mutateAsync(payload);
        toast.success("Profile updated!");
      } else {
        await createProfile.mutateAsync(payload);
        toast.success("Profile activated! Start discovering.");
      }

      await utils.connectProfile.getCurrent.invalidate();
      router.push(isEditing ? "/profile" : "/");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                i === currentStep
                  ? "bg-primary text-primary-foreground"
                  : i < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5",
                  i < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold font-heading mb-1">
        {steps[currentStep]}
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {currentStep === 0 &&
          "Add up to 6 photos, videos, audio clips, or 3D models. First slot is featured."}
        {currentStep === 1 &&
          "Answer at least 1 prompt to show your personality and creative interests."}
        {currentStep === 2 &&
          "Add a bio, headline, what you're looking for, and social links."}
        {currentStep === 3 &&
          "Preview your profile card. This is what others will see."}
      </p>

      {/* Step Content */}
      {currentStep === 0 && (
        <MediaSlotGrid
          slots={mediaSlots}
          onChange={setMediaSlots}
          userId={user?.id || ""}
        />
      )}

      {currentStep === 1 && (
        <PromptEditor prompts={prompts} onChange={setPrompts} />
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself and your creative work..."
              maxLength={CONNECT_LIMITS.BIO_MAX}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/{CONNECT_LIMITS.BIO_MAX}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Graphic Designer & Illustrator"
              maxLength={CONNECT_LIMITS.HEADLINE_MAX}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lookingFor">What are you looking for?</Label>
            <Textarea
              id="lookingFor"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="e.g. Looking for a video editor for my next project..."
              maxLength={CONNECT_LIMITS.LOOKING_FOR_MAX}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Los Angeles, CA"
            />
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium mb-3">Social Links (optional)</p>
            <div className="space-y-3">
              {/* Instagram */}
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="username"
                    className="pl-7"
                  />
                </div>
              </div>
              {/* X / Twitter */}
              <div className="flex items-center gap-2">
                <XIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    @
                  </span>
                  <Input
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="username"
                    className="pl-7"
                  />
                </div>
              </div>
              {/* Website */}
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-website.com"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <ConnectProfileCard
          displayName={profile?.displayName || "Your Name"}
          avatarUrl={profile?.avatarUrl}
          headline={headline}
          location={location}
          lookingFor={lookingFor}
          bio={bio}
          mediaSlots={mediaSlots}
          prompts={prompts}
          instagramHandle={instagramHandle}
          twitterHandle={twitterHandle}
          websiteUrl={websiteUrl}
        />
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {currentStep > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
        {currentStep < steps.length - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSubmitting || !canProceed()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Activate Profile"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
