import type { Metadata } from "next";

import { prisma } from "@ekko/database";
import { CollectiveProjectDetail } from "@/components/collectives/collective-project-detail";

interface CollectivePortfolioPageProps {
  params: Promise<{ slug: string; projectSlug: string }>;
}

export async function generateMetadata({
  params,
}: CollectivePortfolioPageProps): Promise<Metadata> {
  const { slug, projectSlug } = await params;

  const project = await prisma.collectivePortfolioProject.findFirst({
    where: {
      slug: projectSlug,
      collective: { slug },
    },
    select: {
      title: true,
      description: true,
      collective: { select: { name: true } },
    },
  });

  if (!project) {
    return { title: "Project Not Found" };
  }

  return {
    title: `${project.title} — ${project.collective.name}`,
    description:
      project.description?.slice(0, 160) ||
      `${project.title} by ${project.collective.name} on EKKO`,
  };
}

export default async function CollectivePortfolioProject({
  params,
}: CollectivePortfolioPageProps) {
  const { slug, projectSlug } = await params;

  return (
    <CollectiveProjectDetail
      collectiveSlug={slug}
      projectSlug={projectSlug}
    />
  );
}
