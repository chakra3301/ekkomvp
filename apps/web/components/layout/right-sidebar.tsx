"use client";

import Link from "next/link";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { FollowButton } from "@/components/follow/follow-button";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function RightSidebar() {
  const { data: disciplines } = trpc.search.getDisciplines.useQuery();
  const { data: creatorsData } = trpc.search.searchCreatives.useQuery({
    limit: 3,
  });

  const creators = creatorsData?.profiles || [];

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto py-4 px-4 bg-background">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search"
          className="pl-12 rounded-lg bg-muted border-0 focus-visible:ring-1"
        />
      </div>

      {/* Trending / Disciplines */}
      <div className="mt-4 bg-muted rounded-lg overflow-hidden">
        <h2 className="font-bold text-xl px-4 py-3">Explore by Discipline</h2>
        <div className="divide-y divide-border">
          {disciplines?.slice(0, 5).map((discipline) => (
            <Link
              key={discipline.id}
              href={`/discover?discipline=${discipline.id}`}
              className="block px-4 py-3 hover:bg-muted-foreground/10 transition-colors"
            >
              <p className="text-sm text-muted-foreground">Creative Field</p>
              <p className="font-bold">{discipline.name}</p>
            </Link>
          ))}
        </div>
        <Link
          href="/discover"
          className="block px-4 py-3 text-accent hover:bg-muted-foreground/10 transition-colors"
        >
          Show more
        </Link>
      </div>

      {/* Who to follow */}
      <div className="mt-4 bg-muted rounded-lg overflow-hidden">
        <h2 className="font-bold text-xl px-4 py-3">Who to follow</h2>
        <div className="divide-y divide-border">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted-foreground/10 transition-colors"
            >
              <Link href={`/profile/${creator.username}`}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={creator.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(creator.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/profile/${creator.username}`}
                  className="font-bold hover:underline truncate block"
                >
                  {creator.displayName}
                </Link>
                <p className="text-sm text-muted-foreground truncate">
                  @{creator.username}
                </p>
              </div>
              <FollowButton userId={creator.user.id} size="sm" />
            </div>
          ))}
        </div>
        <Link
          href="/discover"
          className="block px-4 py-3 text-accent hover:bg-muted-foreground/10 transition-colors"
        >
          Show more
        </Link>
      </div>

      {/* Footer Links */}
      <div className="mt-4 px-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/about" className="hover:underline">About</Link>
        </div>
        <p className="mt-2">&copy; {new Date().getFullYear()} EKKO</p>
      </div>
    </aside>
  );
}
