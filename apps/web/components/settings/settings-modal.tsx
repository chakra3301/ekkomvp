"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Check,
  User,
  KeyRound,
  Mail,
  ChevronRight,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks";
import { useUser } from "@/hooks/use-user";
import { getAccentColor, setAccentColor } from "@/components/theme-accent-sync";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Bright and clean interface",
    icon: Sun,
    preview: "bg-[#F5F5F5]",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Easy on the eyes at night",
    icon: Moon,
    preview: "bg-[#0F0F0F]",
  },
];

const accentColorOptions = [
  { value: "blue", label: "Blue", class: "bg-[hsl(211,100%,50%)]" },
  { value: "green", label: "Green", class: "bg-[hsl(142,76%,36%)]" },
  { value: "purple", label: "Purple", class: "bg-[hsl(262,83%,58%)]" },
  { value: "violet", label: "Violet", class: "bg-[hsl(258,90%,66%)]" },
  { value: "rose", label: "Rose", class: "bg-[hsl(347,77%,50%)]" },
  { value: "orange", label: "Orange", class: "bg-[hsl(25,95%,53%)]" },
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { profile } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [accent, setAccentState] = useState("blue");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setAccentState(getAccentColor());
    }
  }, [mounted, open]);

  const handleAccentChange = (value: string) => {
    setAccentColor(value);
    setAccentState(value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
          <DialogDescription>
            Customize your EKKO experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Your account */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Your account
            </h3>
            <div className="space-y-1">
              {/* Account information */}
              <div
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg",
                  "bg-white/30 dark:bg-white/10 backdrop-blur-xl",
                  "border border-white/25 dark:border-white/15"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile?.displayName || "Account"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3.5 w-3 flex-shrink-0" />
                    {user?.email ?? "—"}
                  </p>
                </div>
                <Link href="/profile/edit">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Edit profile
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {/* Change your password */}
              <Link href="/forgot-password">
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all",
                    "bg-white/30 dark:bg-white/10 backdrop-blur-xl",
                    "border border-white/25 dark:border-white/15",
                    "hover:bg-white/45 dark:hover:bg-white/15"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Change your password</p>
                    <p className="text-sm text-muted-foreground">
                      Reset your password via email
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              </Link>
            </div>
          </section>

          {/* Customization */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customization
            </h3>

            {/* Dark and light mode */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Appearance</p>
              <div className="grid gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg text-left transition-all",
                        "bg-white/30 dark:bg-white/10 backdrop-blur-xl",
                        "border border-white/25 dark:border-white/15",
                        "hover:bg-white/45 dark:hover:bg-white/15",
                        "hover:-translate-y-0.5",
                        "active:translate-y-0 active:scale-[0.99]",
                        isSelected && "ring-2 ring-primary/50 border-primary/30"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg flex items-center justify-center",
                          "border border-white/20 dark:border-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
                          option.preview
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            option.value === "light" && "text-amber-500",
                            option.value === "dark" && "text-blue-300"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text / accent color */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Accent color</p>
              <p className="text-xs text-muted-foreground">
                Color for links, buttons, and highlights
              </p>
              <div className="flex flex-wrap gap-2">
                {accentColorOptions.map((option) => {
                  const isSelected = accent === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAccentChange(option.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                        "bg-white/30 dark:bg-white/10 backdrop-blur-xl",
                        "border-white/25 dark:border-white/15",
                        "hover:bg-white/45 dark:hover:bg-white/15",
                        isSelected && "ring-2 ring-primary border-primary/50"
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 h-5 rounded-full border-2 border-white/40 shadow-sm",
                          option.class
                        )}
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
