"use client";

import Image from "next/image";
import Link from "next/link";
import { Users, Lock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CollectiveCardProps {
  collective: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    bannerUrl: string | null;
    visibility: string;
    joinType: string;
    membersCount: number;
    postsCount: number;
    creator: {
      id: string;
      profile: {
        displayName: string;
        avatarUrl: string | null;
        username: string;
      } | null;
    };
  };
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function CollectiveCard({ collective }: CollectiveCardProps) {
  const creatorName = collective.creator.profile?.displayName || "Unknown";

  return (
    <Link href={`/collectives/${collective.slug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md h-full">
        {/* Banner */}
        <div className="h-24 bg-muted relative overflow-hidden">
          {collective.bannerUrl ? (
            <Image
              src={collective.bannerUrl}
              alt={collective.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          {collective.visibility === "PRIVATE" && (
            <Badge variant="secondary" className="absolute top-2 right-2 text-xs gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Name + Creator */}
          <h3 className="font-semibold line-clamp-1 group-hover:text-accent transition-colors">
            {collective.name}
          </h3>

          {collective.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {collective.description}
            </p>
          )}

          {/* Meta */}
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {collective.membersCount} {collective.membersCount === 1 ? "member" : "members"}
            </span>
            <span>{collective.postsCount} posts</span>
          </div>

          {/* Creator */}
          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={collective.creator.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                {getInitials(creatorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Created by {creatorName}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
