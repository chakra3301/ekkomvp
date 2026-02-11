"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, Heart, MessageCircle, Mail, Briefcase, FileText, Package, Milestone, DollarSign, Bell, Users2, UserCheck, FileEdit } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    read: boolean;
    entityId: string | null;
    entityType: string | null;
    createdAt: Date;
    actor: {
      id: string;
      profile: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
      } | null;
    };
  };
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const notificationConfig: Record<string, {
  icon: typeof UserPlus;
  text: string;
  getHref: (n: NotificationItemProps["notification"]) => string;
  iconColor: string;
}> = {
  FOLLOW: {
    icon: UserPlus,
    text: "followed you",
    getHref: (n) => `/profile/${n.actor.profile?.username}`,
    iconColor: "text-blue-500",
  },
  LIKE: {
    icon: Heart,
    text: "liked your post",
    getHref: () => "/feed",
    iconColor: "text-red-500",
  },
  COMMENT: {
    icon: MessageCircle,
    text: "commented on your post",
    getHref: () => "/feed",
    iconColor: "text-green-500",
  },
  MESSAGE: {
    icon: Mail,
    text: "sent you a message",
    getHref: () => "/messages",
    iconColor: "text-purple-500",
  },
  WORK_REQUEST: {
    icon: Briefcase,
    text: "sent you a work request",
    getHref: (n) => n.entityId ? `/gigs/${n.entityId}` : "/work-orders",
    iconColor: "text-orange-500",
  },
  APPLICATION: {
    icon: FileText,
    text: "applied to your gig",
    getHref: (n) => n.entityId ? `/gigs/${n.entityId}` : "/gigs",
    iconColor: "text-indigo-500",
  },
  WORK_ORDER_UPDATE: {
    icon: Package,
    text: "updated a work order",
    getHref: (n) => n.entityId ? `/work-orders/${n.entityId}` : "/work-orders",
    iconColor: "text-blue-500",
  },
  DELIVERY: {
    icon: Package,
    text: "submitted a delivery",
    getHref: (n) => n.entityId ? `/work-orders/${n.entityId}` : "/work-orders",
    iconColor: "text-purple-500",
  },
  MILESTONE_UPDATE: {
    icon: Milestone,
    text: "updated a milestone",
    getHref: (n) => n.entityId ? `/work-orders/${n.entityId}` : "/work-orders",
    iconColor: "text-teal-500",
  },
  ESCROW_UPDATE: {
    icon: DollarSign,
    text: "updated escrow",
    getHref: (n) => n.entityId ? `/work-orders/${n.entityId}` : "/work-orders",
    iconColor: "text-green-500",
  },
  COLLECTIVE_INVITE: {
    icon: Users2,
    text: "invited you to a collective",
    getHref: () => "/collectives",
    iconColor: "text-violet-500",
  },
  COLLECTIVE_JOIN_REQUEST: {
    icon: UserPlus,
    text: "requested to join your collective",
    getHref: () => "/collectives",
    iconColor: "text-amber-500",
  },
  COLLECTIVE_JOIN_APPROVED: {
    icon: UserCheck,
    text: "approved your join request",
    getHref: () => "/collectives",
    iconColor: "text-green-500",
  },
  COLLECTIVE_POST: {
    icon: FileEdit,
    text: "posted in your collective",
    getHref: () => "/collectives",
    iconColor: "text-blue-500",
  },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const utils = trpc.useUtils();
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getNotifications.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const config = notificationConfig[notification.type] || {
    icon: Bell,
    text: "sent you a notification",
    getHref: () => "/notifications",
    iconColor: "text-muted-foreground",
  };
  const Icon = config.icon;
  const href = config.getHref(notification);
  const actorName = notification.actor.profile?.displayName || "Someone";

  const handleClick = () => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted border-b border-border",
        !notification.read && "bg-primary/5"
      )}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={notification.actor.profile?.avatarUrl || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {notification.actor.profile?.displayName
            ? getInitials(notification.actor.profile.displayName)
            : "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{actorName}</span>{" "}
          {config.text}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </Link>
  );
}
