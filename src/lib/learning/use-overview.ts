"use client";

import { useQuery } from "@tanstack/react-query";
import type { Overview } from "@/lib/learning/overview";

export function useOverview(activeTeamId?: string | null) {
  return useQuery({
    queryKey: ["overview", activeTeamId ?? ""],
    queryFn: async () => {
      const tz = new Date().getTimezoneOffset();
      const q = new URLSearchParams({ tz: String(tz) });
      if (activeTeamId) q.set("teamId", activeTeamId);
      const res = await fetch(`/api/dashboard/overview?${q}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as Overview;
    },
  });
}
