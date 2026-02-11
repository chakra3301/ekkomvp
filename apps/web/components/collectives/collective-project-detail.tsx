"use client";

import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowLeft, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc/client";
import { PortfolioBlockRenderer } from "@/components/portfolio/blocks/portfolio-block-renderer";

interface CollectiveProjectDetailProps {
  collectiveSlug: string;
  projectSlug: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function CollectiveProjectDetail({
  collectiveSlug,
  projectSlug,
}: CollectiveProjectDetailProps) {
  const { data: project, isLoading } = trpc.collective.getCollectiveProjectBySlug.useQuery({
    collectiveSlug,
    projectSlug,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Project not found</p>
      </div>
    );
  }

  const creatorName = project.createdBy.profile?.displayName || "Unknown";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/collectives/${collectiveSlug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{project.title}</h1>
            <p className="text-xs text-muted-foreground">
              in{" "}
              <Link
                href={`/collectives/${collectiveSlug}`}
                className="hover:underline"
              >
                {project.collective.name}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {project.viewCount}
          </div>
        </div>
      </div>

      {/* Cover */}
      {project.coverUrl && (
        <div className="h-48 sm:h-64 bg-muted relative overflow-hidden">
          <Image
            src={project.coverUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-4 border-b border-border">
        {project.description && (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={project.createdBy.profile?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
              {getInitials(creatorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">Created by {creatorName}</span>
        </div>

        {project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Blocks */}
      <div className="p-4 space-y-4">
        {project.blocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No content blocks yet.</p>
          </div>
        ) : (
          project.blocks.map((block) => (
            <div key={block.id}>
              {/* Contributor tag */}
              {block.contributor && (
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={block.contributor.profile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                      {getInitials(block.contributor.profile?.displayName || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    by {block.contributor.profile?.displayName || "Unknown"}
                  </span>
                </div>
              )}
              <PortfolioBlockRenderer block={block as any} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
