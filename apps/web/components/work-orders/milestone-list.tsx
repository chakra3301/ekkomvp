"use client";

import { useState } from "react";
import { Plus, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";

interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  dueDate?: string | Date | null;
  status: string;
  order: number;
}

interface MilestoneListProps {
  workOrderId: string;
  milestones: Milestone[];
  canEdit: boolean;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDING: { label: "Pending", class: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In Progress", class: "bg-blue-500/10 text-blue-600" },
  DELIVERED: { label: "Delivered", class: "bg-purple-500/10 text-purple-600" },
  IN_REVISION: { label: "Revision", class: "bg-orange-500/10 text-orange-600" },
  APPROVED: { label: "Approved", class: "bg-green-500/10 text-green-600" },
};

export function MilestoneList({ workOrderId, milestones, canEdit }: MilestoneListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const utils = trpc.useUtils();

  const addMutation = trpc.workorder.addMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone added");
      setTitle("");
      setAmount("");
      setDueDate("");
      setShowAdd(false);
      utils.workorder.getById.invalidate(workOrderId);
    },
    onError: (error) => toast.error(error.message),
  });

  const reorderMutation = trpc.workorder.reorderMilestones.useMutation({
    onSuccess: () => utils.workorder.getById.invalidate(workOrderId),
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    addMutation.mutate({
      workOrderId,
      title: title.trim(),
      amount: Number(amount) || 0,
      dueDate: dueDate || null,
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const ids = milestones.map((m) => m.id);
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    reorderMutation.mutate({ workOrderId, milestoneIds: ids });
  };

  const total = milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Milestones</h3>
        {canEdit && (
          <Button size="sm" variant="ghost" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {milestones.length === 0 && !showAdd ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No milestones yet. {canEdit && "Add milestones to break the project into phases."}
        </p>
      ) : (
        <div className="space-y-2">
          {milestones.map((milestone, index) => {
            const status = statusConfig[milestone.status] || { label: milestone.status, class: "" };
            return (
              <div
                key={milestone.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                {canEdit && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                      onClick={() => handleMove(index, "down")}
                      disabled={index === milestones.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm truncate">{milestone.title}</span>
                    <Badge className={status.class} variant="secondary">
                      {status.label}
                    </Badge>
                  </div>
                  {milestone.dueDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due: {format(new Date(milestone.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                </div>

                <span className="text-sm font-medium">${milestone.amount}</span>
              </div>
            );
          })}

          {milestones.length > 0 && (
            <div className="flex justify-end text-sm font-medium pt-1">
              Total: ${total}
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg border bg-card p-3 space-y-3">
          <Input
            placeholder="Milestone title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Amount ($)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Add Milestone
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
