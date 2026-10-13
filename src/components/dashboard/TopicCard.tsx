import Link from "next/link";
import { ChevronLeft, Layers, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fa } from "@/lib/learning/status";
import type { TopicSummary } from "@/lib/learning/overview";

export function TopicCard({ topic }: { topic: TopicSummary }) {
  const isTeam = topic.scope === "TEAM";
  return (
    <Link href={`/dashboard/topics/${topic.id}`} className="group block">
      <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:shadow-float">
        <div className="flex items-start justify-between gap-3">
          <Badge variant={isTeam ? "team" : "personal"} className="max-w-[75%]">
            {isTeam ? (
              <Users className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <User className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">
              {isTeam ? `تیم ${topic.teamName ?? ""}`.trim() : "شخصی"}
            </span>
          </Badge>
          <ChevronLeft className="h-5 w-5 text-text-muted transition group-hover:-translate-x-1" />
        </div>

        <h3 className="mt-4 text-lg font-semibold leading-snug" dir="auto">
          {topic.titleFa?.trim() || topic.titleEn}
        </h3>
        {topic.titleFa && (
          <p className="mt-0.5 text-sm text-text-muted" dir="ltr">
            {topic.titleEn}
          </p>
        )}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-text-muted">پیشرفت</span>
            <span className="font-semibold tabular-nums">{fa(topic.percent)}٪</span>
          </div>
          <ProgressBar value={topic.percent} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            {fa(topic.chapterCount)} سرفصل
          </span>
          <span>
            {fa(topic.done)} از {fa(topic.total)} مبحث
          </span>
        </div>
      </Card>
    </Link>
  );
}
