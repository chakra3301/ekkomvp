"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, MessageCircle, User, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks";
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
  const { profile } = useProfile();

  const { data: unreadCount } = trpc.connectChat.getUnreadCount.useQuery(
    undefined,
    { enabled: !!profile }
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 glass border-b border-white/20 dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold font-heading">
              <span className="text-primary">EKKO</span>{" "}
              <span className="text-foreground">Connect</span>
            </h1>
            <Link href="/settings" className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-16">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20 dark:border-white/10">
          <div className="mx-auto max-w-lg flex items-center justify-around h-14">
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
        </nav>
      </div>
    </div>
  );
}
