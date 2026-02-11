"use client";

import { useEffect } from "react";

const STORAGE_KEY = "ekko-accent";

export function ThemeAccentSync() {
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      document.documentElement.dataset.accent = stored;
    }
  }, []);
  return null;
}

export function setAccentColor(value: string) {
  if (value) {
    localStorage.setItem(STORAGE_KEY, value);
    document.documentElement.dataset.accent = value;
  } else {
    localStorage.removeItem(STORAGE_KEY);
    delete document.documentElement.dataset.accent;
  }
}

export function getAccentColor(): string {
  if (typeof window === "undefined") return "blue";
  return localStorage.getItem(STORAGE_KEY) || "blue";
}
