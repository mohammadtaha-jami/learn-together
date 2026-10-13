"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TeamListItem = {
  id: string;
  name: string;
  inviteCode: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  memberCount: number;
  topicCount: number;
};

type TeamsResponse = {
  teams: TeamListItem[];
  activeTeamId: string | null;
  team: TeamListItem | null;
  role: string | null;
};

type ActiveTeamContextValue = {
  teams: TeamListItem[];
  activeTeamId: string | null;
  activeTeam: TeamListItem | null;
  isLoading: boolean;
  setActiveTeamId: (teamId: string) => Promise<void>;
  refreshTeams: () => void;
};

const ActiveTeamContext = createContext<ActiveTeamContextValue | null>(null);

export function ActiveTeamProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as TeamsResponse;
    },
  });

  const setActiveTeamId = useCallback(
    async (teamId: string) => {
      const res = await fetch("/api/team/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "خطا در انتخاب تیم");
      }
      await qc.invalidateQueries({ queryKey: ["team"] });
      await qc.invalidateQueries({ queryKey: ["topics"] });
      await qc.invalidateQueries({ queryKey: ["overview"] });
    },
    [qc],
  );

  const refreshTeams = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["team"] });
  }, [qc]);

  const value = useMemo(
    () => ({
      teams: data?.teams ?? [],
      activeTeamId: data?.activeTeamId ?? null,
      activeTeam: data?.team ?? null,
      isLoading,
      setActiveTeamId,
      refreshTeams,
    }),
    [data, isLoading, setActiveTeamId, refreshTeams],
  );

  return (
    <ActiveTeamContext.Provider value={value}>{children}</ActiveTeamContext.Provider>
  );
}

export function useActiveTeam() {
  const ctx = useContext(ActiveTeamContext);
  if (!ctx) {
    throw new Error("useActiveTeam must be used within ActiveTeamProvider");
  }
  return ctx;
}

/** Optional hook for components that may render outside provider (returns null). */
export function useActiveTeamOptional() {
  return useContext(ActiveTeamContext);
}
