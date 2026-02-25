"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-bold font-heading mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          An error occurred while loading this page.
        </p>
        <Button onClick={reset} size="sm">
          Try Again
        </Button>
      </div>
    </div>
  );
}
