"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Layers, Trash2, User, Users } from "lucide-react";
import { DeleteTopicDialog } from "@/components/learning/DeleteTopicDialog";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fa } from "@/lib/learning/status";
import type { TopicSummary } from "@/lib/learning/overview";
import { cn } from "@/lib/utils/cn";

export function TopicCard({ topic }: { topic: TopicSummary }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isTeam = topic.scope === "TEAM";

  return (
    <>
      <Card className="group h-full transition hover:-translate-y-0.5 hover:shadow-float">
        <Link href={`/dashboard/topics/${topic.id}`} className="block">
          <div className="flex items-start justify-between gap-2">
            <Badge
              variant={isTeam ? "team" : "personal"}
              className="min-w-0 max-w-[calc(100%-5.5rem)]"
            >
              {isTeam ? (
                <Users className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <User className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">
                {isTeam ? `تیم ${topic.teamName ?? ""}`.trim() : "شخصی"}
              </span>
            </Badge>

            <div className="flex shrink-0 items-center gap-0.5">
              {topic.canDelete && (
                <button
                  type="button"
                  aria-label="حذف موضوع"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "icon",
                      className:
                        "h-9 w-9 text-text-muted opacity-80 transition hover:bg-state-danger/10 hover:text-state-danger group-hover:opacity-100",
                    }),
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <span
                className="grid h-9 w-9 place-items-center text-text-muted transition group-hover:-translate-x-0.5"
                aria-hidden
              >
                <ChevronLeft className="h-5 w-5" />
              </span>
            </div>
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
        </Link>
      </Card>

      <DeleteTopicDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        topic={
          deleteOpen
            ? {
                id: topic.id,
                titleEn: topic.titleEn,
                titleFa: topic.titleFa,
                scope: topic.scope,
                teamName: topic.teamName,
              }
            : null
        }
      />
    </>
  );
}
