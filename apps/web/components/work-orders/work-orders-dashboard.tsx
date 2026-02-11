"use client";

import { useState } from "react";
import { Loader2, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { WorkOrderCard } from "./work-order-card";

type StatusFilter = "ALL" | "PENDING" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED" | "CANCELLED";

const tabs: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "IN_PROGRESS" },
  { label: "Pending", value: "PENDING" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function WorkOrdersDashboard() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.workorder.getMyWorkOrders.useInfiniteQuery(
    {
      status: statusFilter !== "ALL" ? statusFilter as any : undefined,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const workOrders = data?.pages.flatMap((page) => page.workOrders) ?? [];

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Work Orders</h1>
        </div>

        {/* Tab filters */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              size="sm"
              variant={statusFilter === tab.value ? "default" : "ghost"}
              className="rounded-full text-xs h-8"
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No work orders</p>
            <p className="text-sm mt-1">
              {statusFilter === "ALL"
                ? "Work orders will appear here when you accept a gig or request."
                : `No ${statusFilter.toLowerCase().replace("_", " ")} work orders.`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {workOrders.map((wo) => (
                <WorkOrderCard key={wo.id} workOrder={wo} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-lg"
                >
                  {isFetchingNextPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
