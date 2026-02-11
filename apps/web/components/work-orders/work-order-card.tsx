"use client";

import Link from "next/link";
import { DollarSign, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks";

interface WorkOrderCardProps {
  workOrder: {
    id: string;
    status: string;
    agreedRate: number;
    agreedBudgetType: string;
    deadline?: string | Date | null;
    createdAt: string | Date;
    project: { id: string; title: string };
    client: {
      id: string;
      profile?: { displayName: string; avatarUrl?: string | null; username: string } | null;
    };
    creative: {
      id: string;
      profile?: { displayName: string; avatarUrl?: string | null; username: string } | null;
    };
    escrow?: { status: string; totalAmount: number } | null;
    _count: { milestones: number; deliveries: number };
  };
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-yellow-500/10 text-yellow-600" },
  ACCEPTED: { label: "Accepted", class: "bg-blue-500/10 text-blue-600" },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-500/10 text-blue-600" },
  DELIVERED: { label: "Delivered", class: "bg-purple-500/10 text-purple-600" },
  IN_REVISION: { label: "In Revision", class: "bg-orange-500/10 text-orange-600" },
  COMPLETED: { label: "Completed", class: "bg-green-500/10 text-green-600" },
  CANCELLED: { label: "Cancelled", class: "bg-red-500/10 text-red-600" },
  DISPUTED: { label: "Disputed", class: "bg-red-500/10 text-red-600" },
};

const escrowLabel: Record<string, string> = {
  PENDING: "Escrow Pending",
  FUNDED: "Escrow Funded",
  PARTIALLY_RELEASED: "Partially Released",
  RELEASED: "Escrow Released",
  REFUNDED: "Refunded",
};

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const { profile } = useProfile();
  const isClient = profile?.user?.id === workOrder.client.id;
  const otherParty = isClient ? workOrder.creative : workOrder.client;
  const otherName = otherParty.profile?.displayName || "User";
  const status = statusConfig[workOrder.status] || { label: workOrder.status, class: "" };

  return (
    <Link href={`/work-orders/${workOrder.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={otherParty.profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(otherName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                  {workOrder.project.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isClient ? "Creative" : "Client"}: {otherName}
                </p>
              </div>
            </div>
            <Badge className={status.class} variant="secondary">
              {status.label}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${workOrder.agreedRate}
              {workOrder.agreedBudgetType === "HOURLY" && "/hr"}
            </span>
            {workOrder.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due {formatDistanceToNow(new Date(workOrder.deadline), { addSuffix: true })}
              </span>
            )}
            {workOrder._count.milestones > 0 && (
              <span>{workOrder._count.milestones} milestones</span>
            )}
            {workOrder._count.deliveries > 0 && (
              <span>{workOrder._count.deliveries} deliveries</span>
            )}
            {workOrder.escrow && (
              <Badge variant="outline" className="text-xs">
                {escrowLabel[workOrder.escrow.status] || workOrder.escrow.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
