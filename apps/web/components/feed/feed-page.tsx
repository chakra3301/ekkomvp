"use client";

import { useState } from "react";
import { Users2, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import { Feed } from "./feed";
import { CollectivesFeed } from "./collectives-feed";

type Tab = "for-you" | "collectives";

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<Tab>("for-you");

  const tabs: { id: Tab; label: string; icon: typeof Newspaper }[] = [
    { id: "for-you", label: "For You", icon: Newspaper },
    { id: "collectives", label: "Collectives", icon: Users2 },
  ];

  return (
    <div>
      {/* Sticky Header with Tabs */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Home</h1>
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
