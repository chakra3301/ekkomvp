"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ExternalLink, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { useProfile } from "@/hooks";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useProfile();

  const { data: connectProfile } = trpc.connectProfile.getCurrent.useQuery(
    undefined,
    { enabled: !!user }
  );
  const toggleActive = trpc.connectProfile.toggleActive.useMutation();
  const utils = trpc.useUtils();

  // Local filter state (stored in localStorage in a real implementation)
  const [locationFilter, setLocationFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CREATIVE" | "CLIENT">(
    "ALL"
  );

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

          <div className="space-y-2">
            <Label className="text-sm">Location</Label>
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="e.g. Los Angeles"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Show me</Label>
            <div className="flex gap-2">
              {(["ALL", "CREATIVE", "CLIENT"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === role
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
