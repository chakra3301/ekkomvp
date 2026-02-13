"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  Mail,
  Users2,
  Briefcase,
  ClipboardList,
  Bookmark,
  BarChart3,
  User,
  Settings,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

const primaryNavItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Explore", icon: Search },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
];

const drawerNavItems = [
  { href: "/collectives", label: "Collectives", icon: Users2 },
  { href: "/gigs", label: "Gigs", icon: Briefcase },
  { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useProfile();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    onClose();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-[70] w-[280px] bg-background border-r flex flex-col transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header with profile info */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            {profile ? (
              <Link
                href={`/profile/${profile.username}`}
                onClick={onClose}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile.displayName
                      ? getInitials(profile.displayName)
                      : user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <div className="h-10 w-10" />
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {profile && (
            <Link href={`/profile/${profile.username}`} onClick={onClose}>
              <p className="font-bold text-base">{profile.displayName || "User"}</p>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </Link>
          )}
          {profile && (
            <div className="flex gap-4 mt-3 text-sm">
              <span>
                <strong>{profile.followingCount ?? 0}</strong>{" "}
                <span className="text-muted-foreground">Following</span>
              </span>
              <span>
                <strong>{profile.followersCount ?? 0}</strong>{" "}
                <span className="text-muted-foreground">Followers</span>
              </span>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {profile && (
            <Link
              href={`/profile/${profile.username}`}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-colors",
                pathname?.startsWith("/profile/")
                  ? "font-bold text-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <User className={cn("h-6 w-6", pathname?.startsWith("/profile/") && "stroke-[2.5]")} />
              Profile
            </Link>
          )}

          {drawerNavItems
            .filter((item) => {
              if ((item.href === "/work-orders" || item.href === "/bookmarks" || item.href === "/analytics") && !user) return false;
              return true;
            })
            .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-colors",
                pathname === item.href
                  ? "font-bold text-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-6 w-6", pathname === item.href && "stroke-[2.5]")} />
              {item.label}
            </Link>
          ))}

          {profile?.user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={onClose}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-colors",
                pathname === "/admin"
                  ? "font-bold text-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <Shield className={cn("h-6 w-6", pathname === "/admin" && "stroke-[2.5]")} />
              Admin
            </Link>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t py-2">
          <Link
            href="/settings"
            onClick={onClose}
            className={cn(
              "flex items-center gap-4 px-6 py-3.5 text-base font-medium transition-colors",
              pathname === "/settings"
                ? "font-bold text-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Settings className={cn("h-6 w-6", pathname === "/settings" && "stroke-[2.5]")} />
            Settings
          </Link>
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-6 py-3.5 text-base font-medium text-foreground hover:bg-muted transition-colors w-full"
            >
              <LogOut className="h-6 w-6" />
              Log out
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useProfile();

  const { data: unreadMessages } = trpc.message.getUnreadCount.useQuery(undefined, {
    enabled: !!profile,
    refetchInterval: 30000,
  });
  const { data: unreadNotifications } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!profile,
    refetchInterval: 30000,
  });

  return (
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
      </div>
    </nav>
  );
}
