"use client";

import { useEffect } from "react";

import { hexToHsl } from "@/lib/color-utils";

interface ProfileAccentScopeProps {
  accentColor: string | null;
  children: React.ReactNode;
}

export function ProfileAccentScope({
  accentColor,
  children,
}: ProfileAccentScopeProps) {
  useEffect(() => {
    if (!accentColor) return;

    const root = document.documentElement;
    const hsl = hexToHsl(accentColor);

    // Save original values
    const originalPrimary = root.style.getPropertyValue("--primary");
    const originalAccent = root.style.getPropertyValue("--accent");
    const originalRing = root.style.getPropertyValue("--ring");

    // Override with profile accent
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--accent", hsl);
    root.style.setProperty("--ring", hsl);

    return () => {
      // Restore original values (or remove if they were empty)
      if (originalPrimary) {
        root.style.setProperty("--primary", originalPrimary);
      } else {
        root.style.removeProperty("--primary");
      }
      if (originalAccent) {
        root.style.setProperty("--accent", originalAccent);
      } else {
        root.style.removeProperty("--accent");
      }
      if (originalRing) {
        root.style.setProperty("--ring", originalRing);
      } else {
        root.style.removeProperty("--ring");
      }
    };
  }, [accentColor]);

  return <>{children}</>;
}
