"use client";

import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowButton } from "@/components/follow/follow-button";
import { trpc } from "@/lib/trpc/client";

interface SuggestedFollowsProps {
  userRole: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function SuggestedFollows({ userRole }: SuggestedFollowsProps) {
  const router = useRouter();
  const { data: profiles, isLoading } =
    trpc.profile.getSuggestedFollows.useQuery();

  const handleContinue = () => {
    if (userRole === "CREATIVE") {
      router.push("/onboarding/first-post");
    } else {
      router.push("/feed");
    }
  };

  const handleSkip = () => {
    if (userRole === "CREATIVE") {
      router.push("/onboarding/first-post");
    } else {
      router.push("/feed");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-heading">
          Follow Some Creatives
        </CardTitle>
        <CardDescription>
          Follow people to fill your feed with inspiring work
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profiles && profiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profiles.map((profile) => (
              <div
                key={profile.username}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {profile.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile.headline || `@${profile.username}`}
                  </p>
                </div>
                <FollowButton userId={profile.user.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No profiles to suggest yet. You can discover more creatives later.
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button className="flex-1" onClick={handleContinue}>
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
