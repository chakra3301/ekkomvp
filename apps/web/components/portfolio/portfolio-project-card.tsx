"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Star, Layers, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PortfolioProjectCardProps {
  project: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    coverUrl?: string | null;
    thumbnailUrl?: string | null;
    category?: string | null;
    tags: string[];
    isFeatured: boolean;
    viewCount: number;
    _count?: {
      blocks: number;
    };
  };
  username: string;
  isOwnProfile?: boolean;
  onDelete?: (id: string) => void;
}

export function PortfolioProjectCard({ project, username, isOwnProfile, onDelete }: PortfolioProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const imageUrl = project.coverUrl || project.thumbnailUrl;

  return (
    <div className="group">
      <Link
        href={`/profile/${username}/portfolio/${project.slug}`}
        className="block"
      >
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Layers className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Featured badge */}
          {project.isFeatured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-accent text-accent-foreground">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            </div>
          )}

          {/* Edit/Delete menu for own profile */}
          {isOwnProfile && (
            <div className="absolute top-3 right-3 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/portfolio/edit/${project.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h3 className="font-bold text-white text-lg leading-tight line-clamp-2">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-white/80 text-sm mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-white/60 text-xs">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {project.viewCount}
              </span>
              {project._count && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {project._count.blocks} blocks
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title below image */}
        <div className="mt-3">
          <h3 className="font-semibold group-hover:text-accent transition-colors line-clamp-1">
            {project.title}
          </h3>
          {project.category && (
            <p className="text-sm text-muted-foreground">{project.category}</p>
          )}
        </div>
      </Link>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete?.(project.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
