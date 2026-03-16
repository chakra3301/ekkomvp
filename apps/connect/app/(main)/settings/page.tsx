"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Settings,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
  Edit3,
  Moon,
  Sun,
  Monitor,

  ChevronRight,
  ShieldAlert,
  X,
  Instagram,
  Check,
  Unlink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

const STORAGE_KEY = "ekko-connect-filters";

interface DiscoveryFilters {
  city: string;
  maxDistanceMiles: number;
  globalSearch: boolean;
  role: "ALL" | "CREATIVE" | "CLIENT";
}

const DEFAULT_FILTERS: DiscoveryFilters = {
  city: "",
  maxDistanceMiles: 50,
  globalSearch: false,
  role: "ALL",
};

function loadFilters(): DiscoveryFilters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_FILTERS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_FILTERS;
}

function saveFilters(filters: DiscoveryFilters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {}
}

function DeleteAccountSection() {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete account");

      // Sign out locally
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full text-left p-2 -mx-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors"
      >
        Delete Account
      </button>
    );
  }

  return (
    <div className="p-3 -mx-2 rounded-lg border border-destructive/30 bg-destructive/5 space-y-3">
      <div className="flex items-start gap-2">
        <Trash2 className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Delete your account?</p>
          <p className="text-xs text-muted-foreground mt-1">
            This will permanently delete your profile, matches, messages, and all data. This cannot be undone.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="delete-confirm" className="text-xs text-muted-foreground">
          Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm
        </Label>
        <Input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="h-9 text-sm"
          autoComplete="off"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowConfirm(false); setConfirmText(""); }}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || deleting}
        >
          {deleting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Deleting...
            </>
          ) : (
            "Delete Account"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile: mainProfile } = useProfile();
  const { theme, setTheme } = useTheme();

  const { data: connectProfile } = trpc.connectProfile.getCurrent.useQuery(
    undefined,
    { enabled: !!user, staleTime: 1000 * 60 * 5 }
  );
  const { data: blockedUsers } = trpc.block.getBlockedUsers.useQuery(
    undefined,
    { enabled: !!user }
  );

  const toggleActive = trpc.connectProfile.toggleActive.useMutation();
  const updateProfile = trpc.connectProfile.update.useMutation();
  const unblockUser = trpc.block.unblock.useMutation();
  const disconnectIg = trpc.connectProfile.disconnectInstagram.useMutation();
  const utils = trpc.useUtils();

  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  // Handle Instagram OAuth callback result
  useEffect(() => {
    const igStatus = searchParams.get("ig");
    if (igStatus === "connected") {
      toast.success("Instagram connected!");
      utils.connectProfile.getCurrent.invalidate();
      router.replace("/settings", { scroll: false });
    } else if (igStatus === "error") {
      toast.error("Failed to connect Instagram");
      router.replace("/settings", { scroll: false });
    }
  }, [searchParams, router, utils]);

  const updateFilter = <K extends keyof DiscoveryFilters>(
    key: K,
    value: DiscoveryFilters[K]
  ) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    saveFilters(updated);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  };

  const handleToggleActive = async () => {
    try {
      const result = await toggleActive.mutateAsync();
      await utils.connectProfile.getCurrent.invalidate();
      toast.success(
        result.isActive ? "Profile is now visible" : "Profile paused"
      );
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { getCurrentPosition } = await import("@/lib/geolocation");
      const { latitude, longitude } = await getCurrentPosition();

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        "";

      await updateProfile.mutateAsync({
        location: city,
        latitude,
        longitude,
      });
      await utils.connectProfile.getCurrent.invalidate();
      updateFilter("city", city);
      toast.success(`Location set to ${city}`);
    } catch {
      toast.error("Failed to get location");
    }
    setLocating(false);
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser.mutateAsync(userId);
      await utils.block.getBlockedUsers.invalidate();
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock");
    }
  };

  const handleDisconnectInstagram = async () => {
    try {
      await disconnectIg.mutateAsync();
      await utils.connectProfile.getCurrent.invalidate();
      toast.success("Instagram disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const igConnected = !!connectProfile?.instagramAccessToken;

  const hasLocation =
    connectProfile?.latitude != null && connectProfile?.longitude != null;
  const displayName = mainProfile?.displayName || "User";

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Settings
      </h2>

      <div className="space-y-4">
        {/* ============ PROFILE ============ */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Profile
          </h3>

          {/* Profile preview */}
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={mainProfile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {connectProfile?.headline || "View your profile"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>

          <Separator className="my-3" />

          {/* Edit profile */}
          <Link
            href="/profile/setup"
            className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Edit Profile</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {/* Profile visibility */}
          {connectProfile && (
            <div className="flex items-center justify-between p-2 -mx-2">
              <div className="flex items-center gap-3">
                {connectProfile.isActive ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm">Profile Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {connectProfile.isActive ? "Visible" : "Hidden"}
                  </p>
                </div>
              </div>
              <Switch
                checked={connectProfile.isActive}
                onCheckedChange={handleToggleActive}
                disabled={toggleActive.isPending}
              />
            </div>
          )}
        </div>

        {/* ============ INSTAGRAM ============ */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Instagram
          </h3>

          {igConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 -mx-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                    <Instagram className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      @{connectProfile?.instagramHandle}
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    </p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectInstagram}
                  disabled={disconnectIg.isPending}
                  className="text-xs text-muted-foreground"
                >
                  <Unlink className="h-3.5 w-3.5 mr-1" />
                  Disconnect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground px-2">
                Your profile pic and recent posts are shown on your Connect card.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Instagram to show your profile picture and recent
                posts on your card.
              </p>
              <a
                href="/api/auth/instagram"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Instagram className="h-4 w-4" />
                Connect Instagram
              </a>
            </div>
          )}
        </div>

        {/* ============ APPEARANCE ============ */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Appearance
          </h3>

          <div className="flex gap-2">
            {(
              [
                { value: "light", label: "Light", icon: Sun },
                { value: "dark", label: "Dark", icon: Moon },
                { value: "system", label: "System", icon: Monitor },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-colors",
                  theme === value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "glass-card hover:bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ============ DISCOVERY FILTERS ============ */}
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Discovery Filters
          </h3>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm">Location</Label>
            <div className="flex gap-2">
              <Input
                value={filters.city}
                onChange={(e) => updateFilter("city", e.target.value)}
                placeholder="e.g. Los Angeles"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleUseMyLocation}
                disabled={locating}
                title="Use my location"
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            {hasLocation && (
              <p className="text-xs text-muted-foreground">
                GPS location saved
              </p>
            )}
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Maximum Distance</Label>
              <span className="text-xs text-muted-foreground">
                {filters.globalSearch
                  ? "Global"
                  : `${filters.maxDistanceMiles} mi`}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={filters.maxDistanceMiles}
              onChange={(e) =>
                updateFilter("maxDistanceMiles", Number(e.target.value))
              }
              className="w-full accent-primary"
              disabled={filters.globalSearch || !hasLocation}
            />
            {!hasLocation && (
              <p className="text-xs text-muted-foreground">
                Set your location to enable distance filtering
              </p>
            )}
          </div>

          {/* Global search */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Global Search</p>
              <p className="text-xs text-muted-foreground">
                Find creatives worldwide
              </p>
            </div>
            <Switch
              checked={filters.globalSearch}
              onCheckedChange={(v) => updateFilter("globalSearch", v)}
            />
          </div>

          {/* Role filter */}
          <div className="space-y-2">
            <Label className="text-sm">Show me</Label>
            <div className="flex gap-2">
              {(["ALL", "CREATIVE", "CLIENT"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => updateFilter("role", role)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                    filters.role === role
                      ? "bg-primary text-primary-foreground"
                      : "glass-card hover:bg-muted"
                  )}
                >
                  {role === "ALL"
                    ? "Everyone"
                    : role === "CREATIVE"
                      ? "Creatives"
                      : "Clients"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============ BLOCKED USERS ============ */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Blocked Users
          </h3>

          {!blockedUsers || blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No blocked users
            </p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((blocked) => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-2 -mx-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={blocked.profile?.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-xs bg-muted">
                        {getInitials(
                          blocked.profile?.displayName || "?"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {blocked.profile?.displayName || "Deleted User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{blocked.profile?.username || "unknown"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnblock(blocked.id)}
                    disabled={unblockUser.isPending}
                    className="text-xs"
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ ACCOUNT ============ */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Account
          </h3>

          <div className="space-y-1">
            {user && (
              <div className="p-2 -mx-2">
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            )}

            <Separator />

            <Link
              href="/privacy"
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm">Privacy Policy</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm">Terms of Service</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <Separator />

            {user && (
              <button
                onClick={handleSignOut}
                className="w-full text-left p-2 -mx-2 rounded-lg text-sm text-destructive hover:bg-muted/50 transition-colors"
              >
                Log out
              </button>
            )}

            <Separator />

            <DeleteAccountSection />
          </div>
        </div>
      </div>

    </div>
  );
}
