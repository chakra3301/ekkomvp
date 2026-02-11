import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@ekko/database";
import { ProjectDetailView } from "@/components/portfolio/project-detail-view";

interface ProjectPageProps {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { username, slug } = await params;

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: { userId: true },
  });

  if (!profile) {
    return { title: "Project Not Found" };
  }

  const project = await prisma.portfolioProject.findUnique({
    where: {
      userId_slug: {
        userId: profile.userId,
        slug,
      },
    },
    select: { title: true, description: true },
  });

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: project.title,
    description: project.description || `${project.title} by @${username} on EKKO`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { username, slug } = await params;

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: {
      userId: true,
      displayName: true,
      avatarUrl: true,
      verificationStatus: true,
    },
  });

  if (!profile) {
    notFound();
  }

  const project = await prisma.portfolioProject.findUnique({
    where: {
      userId_slug: {
        userId: profile.userId,
        slug,
      },
    },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project || !project.isPublic) {
    notFound();
  }

  // Increment view count
  await prisma.portfolioProject.update({
    where: { id: project.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-6 px-4 py-2">
          <Link
            href={`/profile/${username}`}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold line-clamp-1">{project.title}</h1>
            <p className="text-sm text-muted-foreground">by @{username}</p>
          </div>
        </div>
      </header>

      {/* Project Content */}
      <ProjectDetailView
        project={project}
        author={{
          username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          verificationStatus: profile.verificationStatus,
        }}
      />
    </div>
  );
}
