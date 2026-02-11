"use client";

import { useState } from "react";
import { Loader2, Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { PortfolioProjectCard } from "./portfolio-project-card";
import { CreateProjectModal } from "./create-project-modal";

interface PortfolioGridProps {
  username: string;
  isOwnProfile?: boolean;
}

export function PortfolioGrid({ username, isOwnProfile }: PortfolioGridProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const utils = trpc.useUtils();
  const { data: projects, isLoading, error } = trpc.portfolio.getProjectsByUsername.useQuery(username);

  const deleteProject = trpc.portfolio.deleteProject.useMutation({
    onSuccess: () => {
      utils.portfolio.getProjectsByUsername.invalidate(username);
      toast.success("Project deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete project");
    },
  });

  const handleDelete = (id: string) => {
    deleteProject.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load portfolio</p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="mt-4 font-medium text-muted-foreground">No projects yet</p>
          {isOwnProfile ? (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first portfolio project to showcase your work.
              </p>
              <Button
                className="mt-4 rounded-lg"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              This user hasn&apos;t added any portfolio projects yet.
            </p>
          )}
        </div>
        {isOwnProfile && (
          <CreateProjectModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            username={username}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div>
        {isOwnProfile && (
          <div className="px-4 py-3 border-b">
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        )}
        <div className="p-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {projects.map((project) => (
            <PortfolioProjectCard
              key={project.id}
              project={project}
              username={username}
              isOwnProfile={isOwnProfile}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
      {isOwnProfile && (
        <CreateProjectModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          username={username}
        />
      )}
    </>
  );
}
