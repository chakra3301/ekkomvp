"use client";

import Link from "next/link";
import { MapPin, BadgeCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CreativeCardProps {
  profile: {
    id: string;
    username: string;
    displayName: string;
    headline?: string | null;
    avatarUrl?: string | null;
    location?: string | null;
    availability?: string | null;
    verificationStatus?: string | null;
    hourlyRateMin?: number | null;
    hourlyRateMax?: number | null;
    disciplines?: Array<{
      isPrimary: boolean;
      discipline: {
        name: string;
        slug: string;
      };
    }>;
    skills?: Array<{
      skill: {
        name: string;
      };
    }>;
    user: {
      id: string;
      role: string;
    };
  };
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvailabilityColor = (status: string | null | undefined) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-500";
    case "BUSY":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

export function CreativeCard({ profile }: CreativeCardProps) {
  const primaryDiscipline = profile.disciplines?.find((d) => d.isPrimary);

  return (
    <Link href={`/profile/${profile.username}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              {profile.availability && profile.availability !== "NOT_AVAILABLE" && (
                <span
                  className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    getAvailabilityColor(profile.availability)
                  )}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-medium truncate group-hover:text-accent transition-colors">
                  {profile.displayName}
                </h3>
                {profile.verificationStatus === "VERIFIED" && (
                  <BadgeCheck className="h-4 w-4 text-accent flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                @{profile.username}
              </p>
            </div>
          </div>

          {profile.headline && (
            <p className="mt-3 text-sm line-clamp-2">{profile.headline}</p>
          )}

          {/* Location and Rate */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
            {(profile.hourlyRateMin || profile.hourlyRateMax) && (
              <span>
                ${profile.hourlyRateMin || 0}
                {profile.hourlyRateMax && `-$${profile.hourlyRateMax}`}/hr
              </span>
            )}
          </div>

          {/* Primary Discipline */}
          {primaryDiscipline && (
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs">
                {primaryDiscipline.discipline.name}
              </Badge>
            </div>
          )}

          {/* Top Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.skills.slice(0, 3).map((s) => (
                <Badge key={s.skill.name} variant="outline" className="text-xs">
                  {s.skill.name}
                </Badge>
              ))}
              {profile.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{profile.skills.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
