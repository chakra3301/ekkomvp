"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, User, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useProfile, usePushToken } from "@/hooks";
import { trpc } from "@/lib/trpc/client";

const navItems = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/likes", label: "Likes", icon: Heart },
  { href: "/matches", label: "Matches", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, user } = useProfile();
  usePushToken(user?.id);

  const { data: unreadCount } = trpc.connectChat.getUnreadCount.useQuery(
    undefined,
    { enabled: !!profile }
  );

  return (
    <div className="fixed inset-0 bg-background text-foreground flex flex-col">
      <div className="mx-auto max-w-lg w-full flex flex-col h-full">
        {/* Top Header — 44px standard iOS nav bar + safe area */}
        <header className="flex-shrink-0 z-20 glass-bar safe-top">
          <div className="flex items-center justify-between px-4 h-[44px]">
            <Image src="/logo.png" alt="EKKO Connect" width={28} height={28} className="dark:brightness-0 dark:invert" />
            <Link href="/settings" className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Main Content — scrollable area between header and nav */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Bottom Tab Bar — 49px standard iOS tab bar + safe area spacer */}
        <nav className="flex-shrink-0 z-50 glass-bar">
          <div className="mx-auto max-w-lg flex items-center justify-around h-[49px]">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                pathname?.startsWith(item.href);
              const badgeCount = item.href === "/matches" ? unreadCount?.count : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center h-full px-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
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
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              );
            })}
          </div>
          {/* Safe area spacer — glass-bar background extends through */}
          <div className="safe-bottom" />
        </nav>
      </div>
    </div>
  );
}
