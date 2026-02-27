"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
  Loader2,
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

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useProfile();

  const { data: connectProfile } = trpc.connectProfile.getCurrent.useQuery(
    undefined,
    { enabled: !!user }
  );
  const toggleActive = trpc.connectProfile.toggleActive.useMutation();
  const updateProfile = trpc.connectProfile.update.useMutation();
  const utils = trpc.useUtils();

  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_FILTERS);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

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
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode with Nominatim
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

          // Save location to profile
          await updateProfile.mutateAsync({
            location: city,
            latitude,
            longitude,
          });
          await utils.connectProfile.getCurrent.invalidate();
          updateFilter("city", city);
          toast.success(`Location set to ${city}`);
        } catch {
          toast.error("Failed to get location name");
        }
        setLocating(false);
      },
      () => {
        toast.error("Location access denied");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasLocation =
    connectProfile?.latitude != null && connectProfile?.longitude != null;
  const isInfinite = connectProfile?.connectTier === "INFINITE";

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5" />
        Settings
      </h2>

      <div className="space-y-4">
        {/* Profile visibility */}
        {connectProfile && (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectProfile.isActive ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="font-semibold text-sm">Profile Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {connectProfile.isActive
                      ? "Your profile is visible to others"
                      : "Your profile is hidden"}
                  </p>
                </div>
              </div>
              <Switch
                checked={connectProfile.isActive}
                onCheckedChange={handleToggleActive}
                disabled={toggleActive.isPending}
              />
            </div>
          </div>
        )}

        {/* Discovery Filters */}
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold">Discovery Filters</h3>

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
                {isInfinite
                  ? "Find creatives worldwide"
                  : "Infinite tier only"}
              </p>
            </div>
            <Switch
              checked={filters.globalSearch}
              onCheckedChange={(v) => updateFilter("globalSearch", v)}
              disabled={!isInfinite}
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
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    filters.role === role
                      ? "bg-primary text-primary-foreground"
                      : "glass-card hover:bg-muted"
                  }`}
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

        {/* Account */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3">Account</h3>
          <div className="space-y-2">
            <a
              href={
                process.env.NEXT_PUBLIC_EKKO_URL || "http://localhost:3000"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <span className="text-sm">Open EKKO</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
            <Separator />
            {user && (
              <button
                onClick={handleSignOut}
                className="w-full text-left p-2 rounded-lg text-sm text-destructive hover:bg-muted transition-colors"
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
