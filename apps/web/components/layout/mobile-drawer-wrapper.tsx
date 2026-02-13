"use client";

import { MobileDrawer } from "@/components/layout/mobile-nav";
import { useMobileDrawer } from "@/components/layout/mobile-drawer-provider";

export function MobileDrawerWrapper() {
  const { open, setOpen } = useMobileDrawer();
  return <MobileDrawer open={open} onClose={() => setOpen(false)} />;
}
