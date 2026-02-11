"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Eye,
  ExternalLink,
  BadgeCheck,
  Tag,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortfolioBlockRenderer } from "./blocks/portfolio-block-renderer";

interface ProjectDetailViewProps {
  project: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverUrl?: string | null;
    category?: string | null;
    tags: string[];
    clientName?: string | null;
    projectDate?: Date | null;
    projectUrl?: string | null;
    layout: string;
    viewCount: number;
    createdAt: Date;
    blocks: Array<{
      id: string;
      type: string;
      content: unknown;
      sortOrder: number;
    }>;
  };
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    verificationStatus?: string | null;
  };
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ProjectDetailView({ project, author }: ProjectDetailViewProps) {
  return (
    <div>
      {/* Cover Image */}
      {project.coverUrl && (
        <div className="relative aspect-[21/9] bg-muted">
          <Image
            src={project.coverUrl}
            alt={project.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Project Header */}
      <div className="px-4 py-6 border-b">
        <h1 className="text-2xl sm:text-3xl font-bold">{project.title}</h1>

        {project.description && (
          <p className="mt-3 text-muted-foreground whitespace-pre-line">
            {project.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {project.projectDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(project.projectDate), "MMMM yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {project.viewCount} views
          </span>
          {project.clientName && (
            <span>Client: {project.clientName}</span>
          )}
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-lg">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* External Link */}
        {project.projectUrl && (
          <div className="mt-4">
            <Button variant="outline" size="sm" className="rounded-lg" asChild>
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Project
              </a>
            </Button>
          </div>
        )}

        {/* Author */}
        <div className="mt-6 pt-6 border-t">
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-3 group"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(author.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold group-hover:text-accent transition-colors">
                  {author.displayName}
                </span>
                {author.verificationStatus === "VERIFIED" && (
                  <BadgeCheck className="h-4 w-4 text-accent" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">@{author.username}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Blocks */}
      <div className="px-4 py-6">
        {project.blocks.length > 0 ? (
          <div className="space-y-8">
            {project.blocks.map((block) => (
              <PortfolioBlockRenderer key={block.id} block={block} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>This project has no content blocks yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
