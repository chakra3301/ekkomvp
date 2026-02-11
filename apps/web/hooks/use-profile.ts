"use client";

import { trpc } from "@/lib/trpc/client";
import { useUser } from "./use-user";

export function useProfile() {
  const { user, isLoading: isUserLoading } = useUser();

  const {
    data: profile,
    isLoading: isProfileLoading,
    error,
    refetch,
  } = trpc.profile.getCurrent.useQuery(undefined, {
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user,
    profile,
    isLoading: isUserLoading || isProfileLoading,
    error,
    refetch,
  };
}
