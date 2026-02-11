"use client";

import { useState } from "react";
import { Loader2, Send, Check, RotateCcw, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

interface Delivery {
  id: string;
  message: string;
  attachments: string[];
  status: string;
  revisionNote?: string | null;
  createdAt: string | Date;
  milestone?: { id: string; title: string } | null;
}

interface DeliveryThreadProps {
  workOrderId: string;
  deliveries: Delivery[];
  isCreative: boolean;
  isClient: boolean;
  workOrderStatus: string;
  milestones: Array<{ id: string; title: string; status: string }>;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDING_REVIEW: { label: "Pending Review", class: "bg-yellow-500/10 text-yellow-600" },
  APPROVED: { label: "Approved", class: "bg-green-500/10 text-green-600" },
  REVISION_REQUESTED: { label: "Revision Requested", class: "bg-orange-500/10 text-orange-600" },
};

export function DeliveryThread({
  workOrderId,
  deliveries,
  isCreative,
  isClient,
  workOrderStatus,
  milestones,
}: DeliveryThreadProps) {
  const [message, setMessage] = useState("");
  const [selectedMilestone, setSelectedMilestone] = useState<string>("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const submitDelivery = trpc.workorder.submitDelivery.useMutation({
    onSuccess: () => {
      toast.success("Delivery submitted!");
      setMessage("");
      setSelectedMilestone("");
      utils.workorder.getById.invalidate(workOrderId);
    },
    onError: (error) => toast.error(error.message),
  });

  const approveDelivery = trpc.workorder.approveDelivery.useMutation({
    onSuccess: () => {
      toast.success("Delivery approved!");
      utils.workorder.getById.invalidate(workOrderId);
    },
    onError: (error) => toast.error(error.message),
  });

  const requestRevision = trpc.workorder.requestRevision.useMutation({
    onSuccess: () => {
      toast.success("Revision requested");
      setRevisionNote("");
      setRevisionTargetId(null);
      utils.workorder.getById.invalidate(workOrderId);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = () => {
    if (!message.trim()) return;
    submitDelivery.mutate({
      workOrderId,
      message: message.trim(),
      milestoneId: selectedMilestone || null,
    });
  };

  const canSubmit = isCreative && ["IN_PROGRESS", "IN_REVISION"].includes(workOrderStatus);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Deliveries</h3>

      {deliveries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No deliveries yet.
          {isCreative && " Submit your work when ready."}
        </p>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => {
            const status = statusConfig[delivery.status] || { label: delivery.status, class: "" };
            const isPendingReview = delivery.status === "PENDING_REVIEW";

            return (
              <div key={delivery.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={status.class} variant="secondary">
                      {status.label}
                    </Badge>
                    {delivery.milestone && (
                      <span className="text-xs text-muted-foreground">
                        {delivery.milestone.title}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(delivery.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap">{delivery.message}</p>

                {delivery.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {delivery.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {delivery.revisionNote && (
                  <div className="rounded-md bg-orange-500/5 border border-orange-500/20 p-3">
                    <p className="text-xs font-medium text-orange-600 mb-1">Revision Request:</p>
                    <p className="text-sm">{delivery.revisionNote}</p>
                  </div>
                )}

                {/* Client actions */}
                {isClient && isPendingReview && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => approveDelivery.mutate(delivery.id)}
                      disabled={approveDelivery.isPending}
                    >
                      {approveDelivery.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Approve
                    </Button>
                    {revisionTargetId === delivery.id ? (
                      <div className="flex-1 space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="Describe what needs to be revised..."
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              requestRevision.mutate({
                                deliveryId: delivery.id,
                                revisionNote,
                              })
                            }
                            disabled={!revisionNote.trim() || requestRevision.isPending}
                          >
                            {requestRevision.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                            Send Revision
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRevisionTargetId(null);
                              setRevisionNote("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRevisionTargetId(delivery.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Request Revision
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit delivery form */}
      {canSubmit && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h4 className="text-sm font-medium">Submit Delivery</h4>

          {milestones.length > 0 && (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedMilestone}
              onChange={(e) => setSelectedMilestone(e.target.value)}
            >
              <option value="">General delivery (no milestone)</option>
              {milestones
                .filter((m) => m.status !== "APPROVED")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
          )}

          <Textarea
            rows={3}
            placeholder="Describe what you're delivering..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <Button onClick={handleSubmit} disabled={!message.trim() || submitDelivery.isPending}>
            {submitDelivery.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Submit Delivery
          </Button>
        </div>
      )}
    </div>
  );
}
