"use client";

import { createContext, useContext, useState } from "react";

const MobileDrawerContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({ open: false, setOpen: () => {} });

export function useMobileDrawer() {
  return useContext(MobileDrawerContext);
}

export function MobileDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileDrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileDrawerContext.Provider>
  );
}
