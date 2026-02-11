"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Check, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface SelectedSkill {
  skillId: string;
  name: string;
  proficiency: number;
}

interface SelectedDiscipline {
  disciplineId: string;
  name: string;
  isPrimary: boolean;
}

export function OnboardingSkillsForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<SelectedSkill[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<
    SelectedDiscipline[]
  >([]);

  const { data: disciplines, isLoading: disciplinesLoading } =
    trpc.search.getDisciplines.useQuery();
  const { data: skills, isLoading: skillsLoading } =
    trpc.search.getSkills.useQuery();

  const updateSkills = trpc.profile.updateSkills.useMutation();
  const updateDisciplines = trpc.profile.updateDisciplines.useMutation();

  const toggleDiscipline = (disciplineId: string, name: string) => {
    setSelectedDisciplines((prev) => {
      const existing = prev.find((d) => d.disciplineId === disciplineId);
      if (existing) {
        return prev.filter((d) => d.disciplineId !== disciplineId);
      }
      // If this is the first discipline, make it primary
      const isPrimary = prev.length === 0;
      return [...prev, { disciplineId, name, isPrimary }];
    });
  };

  const setPrimaryDiscipline = (disciplineId: string) => {
    setSelectedDisciplines((prev) =>
      prev.map((d) => ({
        ...d,
        isPrimary: d.disciplineId === disciplineId,
      }))
    );
  };

  const toggleSkill = (skillId: string, name: string) => {
    setSelectedSkills((prev) => {
      const existing = prev.find((s) => s.skillId === skillId);
      if (existing) {
        return prev.filter((s) => s.skillId !== skillId);
      }
      return [...prev, { skillId, name, proficiency: 3 }];
    });
  };

  const setSkillProficiency = (skillId: string, proficiency: number) => {
    setSelectedSkills((prev) =>
      prev.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s))
    );
  };

  const handleSubmit = async () => {
    if (selectedDisciplines.length === 0) {
      toast.error("Please select at least one discipline");
      return;
    }

    setIsLoading(true);

    try {
      // Update disciplines
      await updateDisciplines.mutateAsync({
        disciplines: selectedDisciplines.map((d) => ({
          disciplineId: d.disciplineId,
          isPrimary: d.isPrimary,
        })),
      });

      // Update skills if any selected
      if (selectedSkills.length > 0) {
        await updateSkills.mutateAsync({
          skills: selectedSkills.map((s) => ({
            skillId: s.skillId,
            proficiency: s.proficiency,
          })),
        });
      }

      toast.success("Skills updated successfully!");
      router.push("/onboarding/follows");
    } catch (error) {
      toast.error("Failed to update skills. Please try again.");
      setIsLoading(false);
    }
  };

  // Group skills by category
  const skillsByCategory = skills?.reduce(
    (acc, skill) => {
      const category = skill.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    },
    {} as Record<string, typeof skills>
  );

  if (disciplinesLoading || skillsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disciplines Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-heading">
            Select Your Disciplines
          </CardTitle>
          <CardDescription>
            Choose the creative disciplines that best describe your work. Click
            the star to set your primary discipline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {disciplines?.map((discipline) => {
              const isSelected = selectedDisciplines.some(
                (d) => d.disciplineId === discipline.id
              );
              const isPrimary = selectedDisciplines.find(
                (d) => d.disciplineId === discipline.id
              )?.isPrimary;

              return (
                <div key={discipline.id} className="relative">
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer text-sm py-2 px-3 transition-all",
                      isSelected && "pr-8",
                      isPrimary && "ring-2 ring-accent ring-offset-2"
                    )}
                    onClick={() =>
                      toggleDiscipline(discipline.id, discipline.name)
                    }
                  >
                    {isSelected && (
                      <Check className="mr-1 h-3 w-3 inline-block" />
                    )}
                    {discipline.name}
                  </Badge>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimaryDiscipline(discipline.id);
                      }}
                      className={cn(
                        "absolute -top-1 -right-1 p-1 rounded-full",
                        isPrimary
                          ? "text-accent"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={isPrimary ? "Primary discipline" : "Set as primary"}
                    >
                      <Star
                        className={cn(
                          "h-3 w-3",
                          isPrimary && "fill-current"
                        )}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {selectedDisciplines.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Selected: {selectedDisciplines.map((d) => d.name).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Skills Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-heading">
            Add Your Skills
          </CardTitle>
          <CardDescription>
            Select skills to showcase your expertise. Rate your proficiency from
            1 (beginner) to 5 (expert).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {skillsByCategory &&
            Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {category}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills?.map((skill) => {
                    const selected = selectedSkills.find(
                      (s) => s.skillId === skill.id
                    );

                    return (
                      <div key={skill.id} className="relative group">
                        <Badge
                          variant={selected ? "default" : "outline"}
                          className="cursor-pointer text-sm py-1.5 px-2.5 transition-all"
                          onClick={() => toggleSkill(skill.id, skill.name)}
                        >
                          {selected && (
                            <Check className="mr-1 h-3 w-3 inline-block" />
                          )}
                          {skill.name}
                        </Badge>
                        {selected && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 bg-popover border rounded-md p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSkillProficiency(skill.id, level);
                                  }}
                                  className={cn(
                                    "p-1 rounded hover:bg-muted",
                                    selected.proficiency >= level
                                      ? "text-accent"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  <Star
                                    className={cn(
                                      "h-3 w-3",
                                      selected.proficiency >= level &&
                                        "fill-current"
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {selectedSkills.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">
                Selected Skills ({selectedSkills.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge key={skill.skillId} variant="secondary">
                    {skill.name}
                    <span className="ml-1 text-accent">
                      {"★".repeat(skill.proficiency)}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        disabled={isLoading || selectedDisciplines.length === 0}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        Continue
      </Button>
    </div>
  );
}
