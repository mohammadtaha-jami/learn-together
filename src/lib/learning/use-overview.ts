"use client";

import { useQuery } from "@tanstack/react-query";
import type { Overview } from "@/lib/learning/overview";

export function useOverview() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: async () => {
      const tz = new Date().getTimezoneOffset();
      const res = await fetch(`/api/dashboard/overview?tz=${tz}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as Overview;
    },
  });
}
