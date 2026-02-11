"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { NotificationItem } from "./notification-item";

export function NotificationsList() {
  const utils = trpc.useUtils();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.notification.getNotifications.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getNotifications.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No notifications yet</p>
        <p className="text-sm mt-1">
          When someone follows you, likes your post, or sends you a message,
          you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mark all as read */}
      {hasUnread && (
        <div className="flex justify-end px-4 py-2 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications */}
      <div>
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm"
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
