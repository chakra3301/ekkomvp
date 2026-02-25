import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold font-heading mb-2">
          You&apos;re Offline
        </h2>
        <p className="text-sm text-muted-foreground">
          Check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
