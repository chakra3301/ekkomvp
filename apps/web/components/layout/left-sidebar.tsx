"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  Settings,
  LogOut,
  PenSquare,
  Briefcase,
  ClipboardList,
  Users2,
  Bookmark,
  Shield,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/feed/create-post-modal";
import { useLoginPrompt } from "@/components/auth/login-prompt-provider";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/discover", label: "Explore", icon: Search },
  { href: "/collectives", label: "Collectives", icon: Users2 },
  { href: "/gigs", label: "Gigs", icon: Briefcase },
  { href: "/work-orders", label: "Work Orders", icon: ClipboardList, auth: true },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark, auth: true },
  { href: "/analytics", label: "Analytics", icon: BarChart3, auth: true },
  { href: "/admin", label: "Admin", icon: Shield, auth: true, adminOnly: true },
  { href: "/profile", label: "Profile", icon: User },
];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useProfile();
  const { promptLogin } = useLoginPrompt();
  const [postModalOpen, setPostModalOpen] = useState(false);

  const { data: unreadMessages } = trpc.message.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });
  const { data: unreadNotifications } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 h-screen flex flex-col justify-between py-4 px-2 bg-background">
      {/* Logo */}
      <div>
        <Link
          href="/feed"
          className="flex items-center justify-center xl:justify-start gap-2 xl:px-4 py-3 rounded-lg hover:bg-muted transition-colors"
        >
          <Image
            src="/logo.png"
            alt="EKKO"
            width={32}
            height={32}
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <span className="hidden xl:inline text-xl font-heading font-bold text-foreground">
            EKKO
          </span>
        </Link>

        {/* Navigation */}
        <nav className="mt-4 space-y-1">
          {navItems.filter((item) => {
            if (item.auth && !user) return false;
            if (item.adminOnly && profile?.user?.role !== "ADMIN") return false;
            return true;
          }).map((item) => {
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
                  "flex items-center justify-center xl:justify-start gap-4 px-4 py-3 rounded-lg transition-colors relative",
                  isActive
                    ? "font-bold"
                    : "text-muted-foreground hover:bg-muted"
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
                <span className="hidden xl:inline text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Post Button */}
        <Button
          className="w-full mt-4 rounded-lg h-12 text-lg font-bold hidden xl:flex"
          onClick={() => {
            if (!user) {
              promptLogin("Sign in to create a post.");
            } else {
              setPostModalOpen(true);
            }
          }}
        >
          Post
        </Button>
        <Button
          size="icon"
          className="w-12 h-12 rounded-lg mt-4 xl:hidden mx-auto flex"
          onClick={() => {
            if (!user) {
              promptLogin("Sign in to create a post.");
            } else {
              setPostModalOpen(true);
            }
          }}
        >
          <PenSquare className="h-5 w-5" />
        </Button>
      </div>

      {/* User Menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors w-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.displayName
                    ? getInitials(profile.displayName)
                    : user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden xl:block text-left flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {profile?.displayName || "User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  @{profile?.username || "username"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out @{profile?.username || "user"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Create Post Modal */}
      <CreatePostModal open={postModalOpen} onOpenChange={setPostModalOpen} />
    </aside>
  );
}
