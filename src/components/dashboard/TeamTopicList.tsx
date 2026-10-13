"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, UserPlus, Users } from "lucide-react";
import { TopicCard } from "@/components/dashboard/TopicCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { useActiveTeam } from "@/components/team/ActiveTeamProvider";
import { TeamDialog } from "@/components/team/TeamDialog";
import { Button, buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { fa } from "@/lib/learning/status";
import type { TopicSummary } from "@/lib/learning/overview";
import { cn } from "@/lib/utils/cn";

export function TeamTopicList() {
  const { teams, isLoading: teamsLoading } = useActiveTeam();
  const [dialog, setDialog] = useState<"create" | "join" | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["topics", "TEAM", ""],
    queryFn: async () => {
      const res = await fetch("/api/topics?scope=TEAM");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as TopicSummary[];
    },
    enabled: teams.length > 0,
  });

  const topics = (data ?? []).filter((t) => teamFilter === "ALL" || t.teamId === teamFilter);

  return (
    <div>
      <PageHeader
        title="یادگیری تیمی"
        subtitle="موضوع‌های همهٔ تیم‌هایی که عضوشان هستید."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setDialog("join")}>
              <UserPlus className="h-4 w-4" />
              پیوستن به تیم
            </Button>
            <Button onClick={() => setDialog("create")}>
              <Plus className="h-4 w-4" />
              تیم جدید
            </Button>
          </div>
        }
      />

      {teamsLoading || (teams.length > 0 && isLoading) ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="هنوز عضو هیچ تیمی نیستید"
          description="یک تیم بسازید یا با کد دعوت به تیم دوستانتان بپیوندید."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setDialog("create")}>
                <Plus className="h-4 w-4" />
                ساخت تیم
              </Button>
              <Button variant="secondary" onClick={() => setDialog("join")}>
                <UserPlus className="h-4 w-4" />
                پیوستن با کد
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {teams.length > 1 &&
              [{ id: "ALL", name: "همهٔ تیم‌ها" }, ...teams].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamFilter(t.id)}
                  aria-pressed={teamFilter === t.id}
                  className={cn(
                    "h-10 rounded-pill px-4 text-sm font-medium transition",
                    teamFilter === t.id
                      ? "bg-brand-primary text-white shadow-glow"
                      : "bg-surface-raised text-text-muted ring-1 ring-border/60 hover:text-text",
                  )}
                >
                  {t.name}
                </button>
              ))}
            <Link
              href="/dashboard/topics/new?scope=TEAM"
              className={buttonVariants({ variant: "ghost", size: "sm", className: "ms-auto" })}
            >
              <Plus className="h-4 w-4" />
              موضوع تیمی جدید
            </Link>
          </div>

          {topics.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-6 w-6" />}
              title="این تیم هنوز موضوعی ندارد"
              description="یک کتاب یا مسیر یادگیری بسازید یا از فایل JSON بارگذاری کنید."
              action={
                <Link
                  href={`/dashboard/topics/new?scope=TEAM${teamFilter !== "ALL" ? `&teamId=${teamFilter}` : ""}`}
                  className={buttonVariants({ variant: "primary" })}
                >
                  <Plus className="h-4 w-4" />
                  موضوع جدید
                </Link>
              }
            />
          ) : (
            <>
              <p className="text-sm text-text-muted">{fa(topics.length)} موضوع</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {topics.map((t) => (
                  <TopicCard key={t.id} topic={t} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {dialog && (
        <TeamDialog open onClose={() => setDialog(null)} initialTab={dialog} />
      )}
    </div>
  );
}
