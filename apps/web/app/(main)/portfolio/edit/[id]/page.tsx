import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@ekko/database";
import { ProjectEditor } from "@/components/portfolio/project-editor";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Project",
  description: "Edit your portfolio project on EKKO",
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = await prisma.portfolioProject.findUnique({
    where: { id },
    include: {
      blocks: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  if (project.userId !== user.id) {
    redirect("/profile");
  }

  return (
    <div>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-6 px-4 py-2">
          <Link
            href="/profile"
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Edit Project</h1>
            <p className="text-sm text-muted-foreground">{project.title}</p>
          </div>
        </div>
      </header>

      <ProjectEditor project={project} />
    </div>
  );
}
