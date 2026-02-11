"use client";

import Link from "next/link";
import { MapPin, Clock, DollarSign, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface GigCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budgetType: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    locationType: string;
    location?: string | null;
    deadline?: string | Date | null;
    skillsNeeded: string[];
    createdAt: string | Date;
    client: {
      id: string;
      profile?: {
        displayName: string;
        avatarUrl?: string | null;
        username: string;
        companyName?: string | null;
      } | null;
    };
    discipline?: { id: string; name: string; slug: string } | null;
    _count: { applications: number };
  };
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatBudget = (type: string, min?: number | null, max?: number | null) => {
  if (!min && !max) return null;
  const suffix = type === "HOURLY" ? "/hr" : "";
  if (min && max && min !== max) return `$${min} - $${max}${suffix}`;
  return `$${max || min}${suffix}`;
};

const locationLabel = (type: string) => {
  switch (type) {
    case "REMOTE": return "Remote";
    case "ONSITE": return "On-site";
    case "HYBRID": return "Hybrid";
    default: return type;
  }
};

export function GigCard({ project }: GigCardProps) {
  const clientName = project.client.profile?.companyName || project.client.profile?.displayName || "Client";
  const budget = formatBudget(project.budgetType, project.budgetMin, project.budgetMax);

  return (
    <Link href={`/gigs/${project.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md h-full">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={project.client.profile?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-1 group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clientName}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {budget}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {locationLabel(project.locationType)}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {formatDistanceToNow(new Date(project.deadline), { addSuffix: true })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {project._count.applications} {project._count.applications === 1 ? "applicant" : "applicants"}
            </span>
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1">
            {project.discipline && (
              <Badge variant="secondary" className="text-xs">
                {project.discipline.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {project.budgetType === "FIXED" ? "Fixed Price" : project.budgetType === "HOURLY" ? "Hourly" : "Milestone"}
            </Badge>
            {project.skillsNeeded.slice(0, 2).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skillsNeeded.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{project.skillsNeeded.length - 2}
              </Badge>
            )}
          </div>

          {/* Posted time */}
          <p className="mt-3 text-xs text-muted-foreground">
            Posted {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
