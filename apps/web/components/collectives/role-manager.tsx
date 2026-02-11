"use client";

import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";

interface RoleManagerProps {
  collectiveId: string;
}

const permissionLabels: Record<string, string> = {
  canPost: "Post",
  canModerate: "Moderate",
  canEditPortfolio: "Edit Portfolio",
  canManageMembers: "Manage Members",
  canManageRoles: "Manage Roles",
  canManageCollective: "Manage Collective",
  canInvite: "Invite Members",
};

const permissionKeys = Object.keys(permissionLabels);

export function RoleManager({ collectiveId }: RoleManagerProps) {
  const utils = trpc.useUtils();
  const [editingRole, setEditingRole] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    canPost: true,
    canModerate: false,
    canEditPortfolio: false,
    canManageMembers: false,
    canManageRoles: false,
    canManageCollective: false,
    canInvite: false,
  });

  const { data: roles, isLoading } = trpc.collective.getRoles.useQuery(collectiveId);

  const createMutation = trpc.collective.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created");
      utils.collective.getRoles.invalidate(collectiveId);
      setCreating(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.collective.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.collective.getRoles.invalidate(collectiveId);
      setEditingRole(null);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.collective.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted");
      utils.collective.getRoles.invalidate(collectiveId);
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setRoleName("");
    setPermissions({
      canPost: true,
      canModerate: false,
      canEditPortfolio: false,
      canManageMembers: false,
      canManageRoles: false,
      canManageCollective: false,
      canInvite: false,
    });
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setPermissions(role.permissions as Record<string, boolean>);
  };

  const handleSave = () => {
    if (editingRole) {
      updateMutation.mutate({
        roleId: editingRole.id,
        name: roleName || undefined,
        permissions: permissions as any,
      });
    } else {
      if (!roleName.trim()) {
        toast.error("Role name is required");
        return;
      }
      createMutation.mutate({
        collectiveId,
        name: roleName.trim(),
        permissions: permissions as any,
      });
    }
  };

  const isDialogOpen = creating || !!editingRole;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isCreatorRole = editingRole?.slug === "creator";

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Roles</h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Role
        </Button>
      </div>

      <div className="space-y-2">
        {roles?.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-sm">{role.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {role._count.members} {role._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
              {role.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(role)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!role.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete role "${role.name}"? Members will be reassigned to Member.`)) {
                      deleteMutation.mutate(role.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditingRole(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? `Edit "${editingRole.name}"` : "Create New Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Reviewer"
                disabled={isSaving}
                maxLength={30}
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              {permissionKeys.map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{permissionLabels[key]}</span>
                  <Switch
                    checked={permissions[key] || false}
                    onCheckedChange={(checked) =>
                      setPermissions((prev) => ({ ...prev, [key]: checked }))
                    }
                    disabled={isSaving || isCreatorRole}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                setEditingRole(null);
                resetForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingRole ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
