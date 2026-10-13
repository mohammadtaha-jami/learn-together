"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import type { TopicScope } from "@prisma/client";
import { TopicCard } from "@/components/dashboard/TopicCard";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TopicSummary } from "@/lib/learning/overview";

export function TopicList({
  scope,
  teamId,
  canCreate = true,
}: {
  scope: TopicScope;
  teamId?: string | null;
  canCreate?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["topics", scope, teamId ?? ""],
    queryFn: async () => {
      const q = new URLSearchParams({ scope });
      if (teamId) q.set("teamId", teamId);
      const res = await fetch(`/api/topics?${q}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as TopicSummary[];
    },
    enabled: scope !== "TEAM" || !!teamId,
  });

  const newHref = `/dashboard/topics/new?scope=${scope}`;

  if (scope === "TEAM" && !teamId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-52" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="هنوز موضوعی ندارید"
        description="یک کتاب یا موضوع بسازید و سرفصل‌هایش را اضافه کنید."
        action={
          canCreate && (
            <Link href={newHref} className={buttonVariants({ variant: "primary" })}>
              <Plus className="h-4 w-4" />
              موضوع جدید
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Link href={newHref} className={buttonVariants({ variant: "secondary" })}>
            <Plus className="h-4 w-4" />
            موضوع جدید
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((t) => (
          <TopicCard key={t.id} topic={t} />
        ))}
      </div>
    </div>
  );
}
