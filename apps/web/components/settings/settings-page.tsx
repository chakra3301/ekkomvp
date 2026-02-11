"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Check,
  Mail,
  KeyRound,
  ArrowLeft,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { createClient } from "@/lib/supabase/client";
import { getAccentColor, setAccentColor } from "@/components/theme-accent-sync";
import { BlockedUsers } from "@/components/settings/blocked-users";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface SettingsPageProps {
  userEmail: string;
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

type NotificationPrefs = {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  workOrders: boolean;
  collectives: boolean;
};

const defaultPrefs: NotificationPrefs = {
  likes: true,
  comments: true,
  follows: true,
  messages: true,
  workOrders: true,
  collectives: true,
};

export function SettingsPage({ userEmail }: SettingsPageProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const utils = trpc.useUtils();
  const [mounted, setMounted] = useState(false);
  const [accent, setAccentState] = useState("blue");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { data: tierData } = trpc.subscription.getCurrentTier.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setAccentState(getAccentColor());
    }
  }, [mounted]);

  // Load notification prefs from profile
  useEffect(() => {
    if (profile?.notificationPreferences) {
      setNotifPrefs({
        ...defaultPrefs,
        ...(profile.notificationPreferences as Partial<NotificationPrefs>),
      });
    }
  }, [profile]);

  const updateNotifPrefs = trpc.profile.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved");
      utils.profile.getCurrent.invalidate();
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  const handleAccentChange = (value: string) => {
    setAccentColor(value);
    setAccentState(value);
  };

  const handleNotifToggle = (key: keyof NotificationPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    updateNotifPrefs.mutate(updated);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      // Sign out first (actual account deletion would require a server action or admin API)
      await supabase.auth.signOut();
      toast.success("Account signed out. Contact support to complete account deletion.");
      router.push("/login");
    } catch {
      toast.error("Failed to process account deletion");
      setIsDeleting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-6 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Account Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userEmail}</p>
              </div>
            </div>

            <Link href="/forgot-password" className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Change password</p>
                  <p className="text-sm text-muted-foreground">
                    Reset your password via email
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Subscription</h2>
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="font-medium">{tierData?.limits.name || "Free"}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpgradeModalOpen(true)}
            >
              {tierData?.tier === "FREE" ? "Upgrade" : "Manage"}
            </Button>
          </div>
        </section>

        <UpgradeModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

        {/* Notifications Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="space-y-1 rounded-lg border bg-card overflow-hidden">
            {[
              { key: "likes" as const, label: "Likes", desc: "When someone likes your post" },
              { key: "comments" as const, label: "Comments", desc: "When someone comments on your post" },
              { key: "follows" as const, label: "Follows", desc: "When someone follows you" },
              { key: "messages" as const, label: "Messages", desc: "When you receive a new message" },
              { key: "workOrders" as const, label: "Work Orders", desc: "Work order and gig updates" },
              { key: "collectives" as const, label: "Collectives", desc: "Collective invites and updates" },
            ].map((item, i) => (
              <div
                key={item.key}
                className={cn(
                  "flex items-center justify-between p-4",
                  i > 0 && "border-t"
                )}
              >
                <div>
                  <Label htmlFor={item.key} className="font-medium cursor-pointer">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={notifPrefs[item.key]}
                  onCheckedChange={() => handleNotifToggle(item.key)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>

          {/* Theme */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Theme</p>
            <div className="grid gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg text-left transition-all border bg-card",
                      "hover:bg-muted/50",
                      isSelected && "ring-2 ring-primary border-primary/30"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center border",
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
                    <div className="flex-1">
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Accent color
            </p>
            <div className="flex flex-wrap gap-2">
              {accentColorOptions.map((option) => {
                const isSelected = accent === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleAccentChange(option.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card transition-all",
                      "hover:bg-muted/50",
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
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Blocked Users */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Blocked Users</h2>
          <BlockedUsers />
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
          <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to delete your account?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data including
                      posts, portfolio, messages, and profile will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1.5" />
                      )}
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
