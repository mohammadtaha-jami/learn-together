"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  CircleDot,
  Flame,
  Play,
  Target,
  Users,
} from "lucide-react";
import type { ProgressStatus } from "@prisma/client";
import { TopicCard } from "@/components/dashboard/TopicCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberBars } from "@/components/ui/MemberBars";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusButton, StatusChip } from "@/components/ui/StatusButton";
import { fa, nextStatus } from "@/lib/learning/status";
import { useActiveTeam } from "@/components/team/ActiveTeamProvider";
import { useOverview } from "@/lib/learning/use-overview";

const HistoryChart = dynamic(
  () => import("@/components/dashboard/HistoryChart").then((m) => m.HistoryChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

function Tile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 p-3.5">
      <div className="mb-2 text-white/80">{icon}</div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-white/80">{label}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { data: session } = useSession();
  const { activeTeamId } = useActiveTeam();
  const { data, isLoading, isError } = useOverview(activeTeamId);
  const qc = useQueryClient();
  const [overrides, setOverrides] = useState<Record<string, ProgressStatus>>({});

  const setStatus = useMutation({
    mutationFn: async (v: { sectionId: string; status: ProgressStatus }) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      if (!res.ok) throw new Error("failed");
    },
    onMutate: (v) => setOverrides((o) => ({ ...o, [v.sectionId]: v.status })),
    onError: (_e, v) =>
      setOverrides((o) => {
        const rest = { ...o };
        delete rest[v.sectionId];
        return rest;
      }),
    onSuccess: (_d, v) => {
      // Keep the row in place for a moment, then refresh numbers.
      setTimeout(async () => {
        await qc.invalidateQueries({ queryKey: ["overview"] });
        qc.invalidateQueries({ queryKey: ["progress"] });
        qc.invalidateQueries({ queryKey: ["topics"] });
        setOverrides((o) => {
          const rest = { ...o };
          delete rest[v.sectionId];
          return rest;
        });
      }, 1200);
    },
  });

  const firstName = session?.user?.name?.split(" ")[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-60 lg:col-span-2" />
          <Skeleton className="h-60" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={<BookOpen className="h-6 w-6" />}
        title="اطلاعات بارگذاری نشد"
        description="صفحه را دوباره باز کنید."
      />
    );
  }

  const { stats, today, week, team, topics } = data;
  const first = today.find((t) => (overrides[t.sectionId] ?? t.status) !== "DONE") ?? today[0];
  const continueHref = first
    ? `/dashboard/topics/${first.topicId}?chapter=${first.chapterId}&section=${first.sectionId}`
    : "/dashboard/team";

  if (topics.length === 0) {
    return (
      <div>
        <PageHeader title={`سلام${firstName ? `، ${firstName}` : ""}`} subtitle="برای شروع یک تیم یا موضوع بسازید." />
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="هنوز موضوعی ندارید"
          description="به یک تیم بپیوندید یا یک موضوع شخصی بسازید."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/team" className={buttonVariants({ variant: "primary" })}>
                <Users className="h-4 w-4" /> یادگیری تیمی
              </Link>
              <Link href="/dashboard/topics/new?scope=PERSONAL" className={buttonVariants({ variant: "secondary" })}>
                موضوع شخصی
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`سلام${firstName ? `، ${firstName}` : ""}`}
        subtitle="امروز هم یک قدم جلوتر برویم."
        action={
          first && (
            <Link href={continueHref} className={buttonVariants({ variant: "primary", size: "lg" })}>
              <Play className="h-5 w-5" />
              ادامه یادگیری
            </Link>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Focal: overall progress */}
        <Card variant="focal" className="lg:col-span-2">
          <p className="text-sm text-white/80">پیشرفت کل</p>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={stats.percent} tone="inverse" size={132} stroke={11}>
              <div>
                <p className="text-3xl font-bold tabular-nums">{fa(stats.percent)}٪</p>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold">
                {fa(stats.done)} مبحث از {fa(stats.total)} تمام شده
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Tile icon={<CircleDot className="h-5 w-5" />} value={fa(stats.inProgress)} label="در حال یادگیری" />
                <Tile icon={<Target className="h-5 w-5" />} value={fa(stats.doneToday)} label="امروز تمام شد" />
                <Tile icon={<Flame className="h-5 w-5" />} value={fa(stats.streak)} label="روز متوالی" />
              </div>
            </div>
          </div>
        </Card>

        {/* Week */}
        <Card>
          <CardTitle icon={<CalendarDays className="h-5 w-5 text-brand-primary" />}>
            ۷ روز اخیر
          </CardTitle>
          <div className="h-40">
            <HistoryChart data={week} />
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {fa(week.reduce((a, d) => a + d.count, 0))} مبحث در این هفته تمام شد
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's reading */}
        <Card className="lg:col-span-2">
          <CardTitle icon={<BookOpen className="h-5 w-5 text-brand-primary" />}>
            مباحث امروز
          </CardTitle>
          {today.length === 0 ? (
            <EmptyState
              icon={<CircleCheck className="h-6 w-6" />}
              title="همهٔ مباحث تمام شده"
              description="آفرین! موضوع تازه‌ای اضافه کنید."
              className="border-0 py-6"
            />
          ) : (
            <ul className="space-y-2.5">
              {today.map((item) => {
                const status = overrides[item.sectionId] ?? item.status;
                return (
                  <li
                    key={item.sectionId}
                    className="flex items-center gap-3 rounded-2xl bg-surface-overlay/50 p-2.5 ps-3"
                  >
                    <StatusButton
                      status={status}
                      onClick={() =>
                        setStatus.mutate({
                          sectionId: item.sectionId,
                          status: nextStatus(status),
                        })
                      }
                    />
                    <Link
                      href={`/dashboard/topics/${item.topicId}?chapter=${item.chapterId}&section=${item.sectionId}`}
                      className="min-w-0 flex-1"
                    >
                      <p
                        className={`truncate text-sm font-medium ${status === "DONE" ? "text-text-muted line-through" : ""}`}
                        dir="auto"
                      >
                        {item.titleFa?.trim() || item.titleEn}
                      </p>
                      <p className="truncate text-xs text-text-muted" dir="auto">
                        {item.chapterNumber ? `${item.chapterNumber} · ` : ""}
                        {item.chapterTitle}
                        {item.parentTitle ? ` › ${item.parentTitle}` : ""}
                      </p>
                    </Link>
                    <StatusChip status={status} />
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-text-muted">
            با هر بار لمس دایره، وضعیت عوض می‌شود: شروع نشده، در حال یادگیری، تمام شد.
          </p>
        </Card>

        {/* Team */}
        <Card>
          <CardTitle icon={<Users className="h-5 w-5 text-brand-primary" />}>تیم</CardTitle>
          {team ? (
            <>
              <p className="mb-4 text-sm text-text-muted">{team.name}</p>
              <MemberBars members={team.members} />
            </>
          ) : (
            <div className="text-sm text-text-muted">
              <p>هنوز عضو تیمی نیستید.</p>
              <Link
                href="/dashboard/team"
                className={buttonVariants({ variant: "accent", size: "sm", className: "mt-3" })}
              >
                ساخت یا پیوستن به تیم
              </Link>
            </div>
          )}
        </Card>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">موضوع‌های من</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
