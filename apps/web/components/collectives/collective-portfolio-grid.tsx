"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { CreateCollectiveProjectModal } from "./create-collective-project-modal";

interface CollectivePortfolioGridProps {
  collectiveId: string;
  collectiveSlug: string;
  canEditPortfolio?: boolean;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function CollectivePortfolioGrid({
  collectiveId,
  collectiveSlug,
  canEditPortfolio,
}: CollectivePortfolioGridProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.collective.getCollectiveProjects.useInfiniteQuery(
      { collectiveId, limit: 12 },
      { getNextPageParam: (last) => last.nextCursor }
    );

  const projects = data?.pages.flatMap((p) => p.projects) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Create button */}
      {canEditPortfolio && (
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No portfolio projects yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const creatorName = project.createdBy.profile?.displayName || "Unknown";

              return (
                <Link
                  key={project.id}
                  href={`/collectives/${collectiveSlug}/portfolio/${project.slug}`}
                >
                  <Card className="group overflow-hidden transition-shadow hover:shadow-md h-full">
                    {/* Cover */}
                    <div className="h-32 bg-muted relative overflow-hidden">
                      {project.coverUrl ? (
                        <Image
                          src={project.coverUrl}
                          alt={project.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Layers className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-1 group-hover:text-accent transition-colors">
                        {project.title}
                      </h3>

                      {project.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={project.createdBy.profile?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                              {getInitials(creatorName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{creatorName}</span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {project._count.blocks}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {project.viewCount}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Show more
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Project Modal */}
      {canEditPortfolio && (
        <CreateCollectiveProjectModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          collectiveId={collectiveId}
          collectiveSlug={collectiveSlug}
        />
      )}
    </div>
  );
}
