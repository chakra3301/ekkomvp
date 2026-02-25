import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="glass-card p-8 max-w-sm w-full text-center">
        <Compass className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold font-heading mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button className="w-full">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
