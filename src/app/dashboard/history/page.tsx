"use client";

import dynamic from "next/dynamic";
import { CircleCheck, CircleDot, Flame, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { fa } from "@/lib/learning/status";
import { useOverview } from "@/lib/learning/use-overview";

const HistoryChart = dynamic(
  () => import("@/components/dashboard/HistoryChart").then((m) => m.HistoryChart),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </span>
      <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </Card>
  );
}

export default function HistoryPage() {
  const { data, isLoading } = useOverview();

  return (
    <div>
      <PageHeader title="آمار من" subtitle="مرور پیشرفت شما در هفتهٔ اخیر" />
      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<CircleCheck className="h-5 w-5" />} value={fa(data.stats.done)} label="مبحث تمام‌شده" />
            <Stat icon={<CircleDot className="h-5 w-5" />} value={fa(data.stats.inProgress)} label="در حال یادگیری" />
            <Stat icon={<Target className="h-5 w-5" />} value={fa(data.stats.doneToday)} label="امروز تمام شد" />
            <Stat icon={<Flame className="h-5 w-5" />} value={fa(data.stats.streak)} label="روز متوالی" />
          </div>
          <Card>
            <CardTitle>مباحث تمام‌شده در ۷ روز اخیر</CardTitle>
            <div className="h-64">
              <HistoryChart data={data.week} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
