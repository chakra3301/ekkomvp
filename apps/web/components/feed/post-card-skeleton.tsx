import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}
