"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold font-heading mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
}
