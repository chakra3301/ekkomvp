"use client";

import { useState } from "react";
import Image from "next/image";
import { Users2, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks";
import { useMobileDrawer } from "@/components/layout/mobile-drawer-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Feed } from "./feed";
import { CollectivesFeed } from "./collectives-feed";

type Tab = "for-you" | "collectives";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<Tab>("for-you");
  const { user, profile } = useProfile();
  const { setOpen: setDrawerOpen } = useMobileDrawer();

  const tabs: { id: Tab; label: string; icon: typeof Newspaper }[] = [
    { id: "for-you", label: "For You", icon: Newspaper },
    { id: "collectives", label: "Collectives", icon: Users2 },
  ];

  return (
    <div>
      {/* Sticky Header with Tabs */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center">
          {/* Mobile: Profile avatar (left) + Logo (center) */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex-shrink-0 mr-3"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {profile?.displayName
                  ? getInitials(profile.displayName)
                  : user?.email?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="md:hidden flex-1 flex justify-center">
            <Image
              src="/elogo.png"
              alt="EKKO"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
          {/* Spacer to balance the avatar on mobile */}
          <div className="md:hidden w-8 flex-shrink-0" />

          {/* Desktop: "Home" title */}
          <h1 className="hidden md:block text-xl font-bold">Home</h1>
        </div>
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab Content */}
      <div className="px-4">
        {activeTab === "for-you" && <Feed />}
        {activeTab === "collectives" && <CollectivesFeed />}
      </div>
    </div>
  );
}
