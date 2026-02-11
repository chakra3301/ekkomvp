import type { Metadata } from "next";

import { prisma } from "@ekko/database";
import { GigDetailPage } from "@/components/gigs/gig-detail-page";

interface GigPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: GigPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { title: true, description: true },
  });

  if (!project) {
    return { title: "Gig Not Found" };
  }

  return {
    title: project.title,
    description:
      project.description?.slice(0, 160) || `${project.title} on EKKO`,
  };
}

export default async function GigPage({ params }: GigPageProps) {
  const { id } = await params;

  return <GigDetailPage gigId={id} />;
}
