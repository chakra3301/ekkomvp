"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { useProfile } from "@/hooks";
import { ApplyModal } from "@/components/gigs/apply-modal";
import { ApplicationsList } from "@/components/gigs/applications-list";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatBudget = (type: string, min?: number | null, max?: number | null) => {
  if (!min && !max) return "Budget not specified";
  const suffix = type === "HOURLY" ? "/hr" : "";
  if (min && max && min !== max) return `$${min} - $${max}${suffix}`;
  return `$${max || min}${suffix}`;
};

interface GigDetailPageProps {
  gigId: string;
}

export function GigDetailPage({ gigId }: GigDetailPageProps) {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const { profile } = useProfile();

  const { data: project, isLoading } = trpc.project.getById.useQuery(gigId);

  const isOwner = project?.client.id === profile?.user?.id;
  const isCreative = profile?.user?.role === "CREATIVE";

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
        Project not found
      </div>
    );
  }

  const clientName = project.client.profile?.companyName || project.client.profile?.displayName || "Client";

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">Gig Details</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold">{project.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Posted {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Client Info */}
        <Card>
          <CardContent className="p-4">
            <Link href={`/profile/${project.client.profile?.username}`} className="flex items-center gap-3 group">
              <Avatar className="h-12 w-12">
                <AvatarImage src={project.client.profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold group-hover:text-accent transition-colors">{clientName}</p>
                {project.client.profile?.headline && (
                  <p className="text-sm text-muted-foreground">{project.client.profile.headline}</p>
                )}
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {formatBudget(project.budgetType, project.budgetMin, project.budgetMax)}
            </span>
            <Badge variant="outline" className="text-xs ml-1">
              {project.budgetType === "FIXED" ? "Fixed" : project.budgetType === "HOURLY" ? "Hourly" : "Milestone"}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {project.locationType === "REMOTE" ? "Remote" : project.locationType === "ONSITE" ? "On-site" : "Hybrid"}
              {project.location && ` · ${project.location}`}
            </span>
          </div>

          {project.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{project._count.applications} {project._count.applications === 1 ? "applicant" : "applicants"}</span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm whitespace-pre-wrap">{project.description}</p>
        </div>

        {/* Skills & Discipline */}
        {(project.discipline || project.skillsNeeded.length > 0) && (
          <div>
            <h3 className="font-semibold mb-2">Skills & Discipline</h3>
            <div className="flex flex-wrap gap-2">
              {project.discipline && (
                <Badge variant="secondary">{project.discipline.name}</Badge>
              )}
              {project.skillsNeeded.map((skill) => (
                <Badge key={skill} variant="outline">{skill}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Apply Button (for creatives) */}
        {isCreative && !isOwner && project.status === "OPEN" && (
          <Button size="lg" className="w-full" onClick={() => setApplyOpen(true)}>
            Apply to this Gig
          </Button>
        )}

        {/* Applications (for project owner) */}
        {isOwner && (
          <>
            <Separator />
            <ApplicationsList projectId={project.id} />
          </>
        )}
      </div>

      {isCreative && (
        <ApplyModal
          open={applyOpen}
          onOpenChange={setApplyOpen}
          projectId={project.id}
          projectTitle={project.title}
        />
      )}
    </div>
  );
}
