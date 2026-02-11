import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ProjectEditor } from "@/components/portfolio/project-editor";

export const metadata: Metadata = {
  title: "Create Project",
  description: "Create a new portfolio project on EKKO",
};

export default async function NewProjectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
            <h1 className="text-xl font-bold">Create Project</h1>
            <p className="text-sm text-muted-foreground">Add to your portfolio</p>
          </div>
        </div>
      </header>

      <ProjectEditor />
    </div>
  );
}
