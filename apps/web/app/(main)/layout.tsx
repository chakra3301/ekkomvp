import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileDrawerProvider } from "@/components/layout/mobile-drawer-provider";
import { MobileDrawerWrapper } from "@/components/layout/mobile-drawer-wrapper";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileDrawerProvider>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl flex">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden md:flex md:w-20 xl:w-72 flex-shrink-0 border-r border-border">
            <LeftSidebar />
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0 border-r border-border min-h-screen bg-background">
            <div className="pb-16 md:pb-0">{children}</div>
          </main>

          {/* Right Sidebar - Hidden on mobile and tablet */}
          <div className="hidden lg:block w-80 flex-shrink-0 bg-background">
            <RightSidebar />
          </div>
        </div>

        {/* Mobile Side Drawer */}
        <MobileDrawerWrapper />

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </MobileDrawerProvider>
  );
}
