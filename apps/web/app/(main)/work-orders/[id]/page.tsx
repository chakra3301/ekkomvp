"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { MilestoneList } from "@/components/work-orders/milestone-list";
import { DeliveryThread } from "@/components/work-orders/delivery-thread";
import { EscrowStatus } from "@/components/work-orders/escrow-status";

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

export default function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile } = useProfile();
  const utils = trpc.useUtils();

  const { data: workOrder, isLoading } = trpc.workorder.getById.useQuery(id);

  const startMutation = trpc.workorder.start.useMutation({
    onSuccess: () => {
      toast.success("Work started!");
      utils.workorder.getById.invalidate(id);
    },
    onError: (error) => toast.error(error.message),
  });

  const cancelMutation = trpc.workorder.cancel.useMutation({
    onSuccess: () => {
      toast.success("Work order cancelled");
      utils.workorder.getById.invalidate(id);
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Work order not found
      </div>
    );
  }

  const isClient = profile?.user?.id === workOrder.clientId;
  const isCreative = profile?.user?.id === workOrder.creativeId;
  const otherParty = isClient ? workOrder.creative : workOrder.client;
  const otherName = otherParty.profile?.displayName || "User";
  const status = statusConfig[workOrder.status] || { label: workOrder.status, class: "" };
  const canCancel = !["COMPLETED", "CANCELLED"].includes(workOrder.status);
  const canStart = isCreative && workOrder.status === "PENDING" && workOrder.escrow?.status === "FUNDED";

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{workOrder.project.title}</h1>
          </div>
          <Badge className={status.class} variant="secondary">
            {status.label}
          </Badge>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
        {/* Overview */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Other party */}
            <div className="flex items-center justify-between">
              <Link
                href={`/profile/${otherParty.profile?.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherParty.profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(otherName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium group-hover:text-accent transition-colors">
                    {otherName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isClient ? "Creative" : "Client"}
                  </p>
                </div>
              </Link>
              <Link href={`/messages?user=${otherParty.id}`}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </Link>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Agreed Rate</p>
                <p className="font-medium">
                  ${workOrder.agreedRate}
                  {workOrder.agreedBudgetType === "HOURLY" && "/hr"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Budget Type</p>
                <p className="font-medium">
                  {workOrder.agreedBudgetType === "FIXED"
                    ? "Fixed Price"
                    : workOrder.agreedBudgetType === "HOURLY"
                      ? "Hourly"
                      : "Milestone"}
                </p>
              </div>
              {workOrder.deadline && (
                <div>
                  <p className="text-muted-foreground text-xs">Deadline</p>
                  <p className="font-medium">{format(new Date(workOrder.deadline), "MMM d, yyyy")}</p>
                </div>
              )}
              {workOrder.startDate && (
                <div>
                  <p className="text-muted-foreground text-xs">Started</p>
                  <p className="font-medium">{format(new Date(workOrder.startDate), "MMM d, yyyy")}</p>
                </div>
              )}
              {workOrder.completedAt && (
                <div>
                  <p className="text-muted-foreground text-xs">Completed</p>
                  <p className="font-medium">{format(new Date(workOrder.completedAt), "MMM d, yyyy")}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {canStart && (
                <Button onClick={() => startMutation.mutate(id)} disabled={startMutation.isPending}>
                  {startMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Start Work
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => cancelMutation.mutate(id)}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Escrow */}
        <EscrowStatus
          workOrderId={workOrder.id}
          escrow={workOrder.escrow}
          isClient={isClient}
        />

        <Separator />

        {/* Milestones */}
        <MilestoneList
          workOrderId={workOrder.id}
          milestones={workOrder.milestones}
          canEdit={!["COMPLETED", "CANCELLED"].includes(workOrder.status)}
        />

        <Separator />

        {/* Deliveries */}
        <DeliveryThread
          workOrderId={workOrder.id}
          deliveries={workOrder.deliveries}
          isCreative={isCreative}
          isClient={isClient}
          workOrderStatus={workOrder.status}
          milestones={workOrder.milestones}
        />
      </div>
    </div>
  );
}
