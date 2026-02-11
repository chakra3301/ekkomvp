"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  Mail,
  MoreHorizontal,
  Users2,
  Briefcase,
  ClipboardList,
  Bookmark,
  BarChart3,
  User,
  Settings,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";

const primaryNavItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Explore", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
];

const moreNavItems = [
  { href: "/collectives", label: "Collectives", icon: Users2 },
  { href: "/gigs", label: "Gigs", icon: Briefcase },
  { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: unreadMessages } = trpc.message.getUnreadCount.useQuery(undefined, {
    enabled: !!profile,
    refetchInterval: 30000,
  });
  const { data: unreadNotifications } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!profile,
    refetchInterval: 30000,
  });

  const isMoreActive = moreNavItems.some((item) => pathname === item.href) ||
    pathname?.startsWith("/profile/") || pathname === "/settings";

  return (
    <>
      {/* Bottom Sheet Overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Bottom Sheet Panel */}
      <div
        className={cn(
          "fixed bottom-14 left-0 right-0 z-40 bg-background border-t rounded-t-2xl transition-transform duration-300 md:hidden",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold">More</span>
          <button
            onClick={() => setMoreOpen(false)}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-2 grid grid-cols-3 gap-1">
          {moreNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          {profile && (
            <Link
              href={`/profile/${profile.username}`}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors",
                pathname?.startsWith("/profile/")
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profile</span>
            </Link>
          )}
          <Link
            href="/settings"
            onClick={() => setMoreOpen(false)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors",
              pathname === "/settings"
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
        <div className="flex items-center justify-around h-14">
          {primaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const badgeCount =
              item.href === "/messages"
                ? unreadMessages?.count
                : item.href === "/notifications"
                  ? unreadNotifications?.count
                  : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center h-full px-4 transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
                  {!!badgeCount && badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center h-full px-4 transition-colors",
              isMoreActive || moreOpen ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className={cn("h-6 w-6", (isMoreActive || moreOpen) && "stroke-[2.5]")} />
          </button>
        </div>
      </nav>
    </>
  );
}
