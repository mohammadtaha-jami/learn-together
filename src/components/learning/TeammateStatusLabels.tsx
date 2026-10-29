import type { ProgressStatus } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/MemberBars";
import { StatusIcon } from "@/components/ui/StatusButton";
import { STATUS_META } from "@/lib/learning/status";
import { cn } from "@/lib/utils/cn";

export type TeammateStatusEntry = {
  userId: string;
  name: string;
  status: Extract<ProgressStatus, "IN_PROGRESS" | "DONE">;
};

const MAX_VISIBLE = 3;

const STATUS_COPY: Record<TeammateStatusEntry["status"], string> = {
  IN_PROGRESS: "در حال یادگیری",
  DONE: "تمام کرد",
};

const CHAPTER_COPY: Record<"IN_PROGRESS", string> = {
  IN_PROGRESS: "اینجاست",
};

export function TeammateStatusLabels({
  entries,
  mode = "section",
  className,
}: {
  entries: TeammateStatusEntry[];
  /** section = leaf labels; chapter = presence «اینجاست» */
  mode?: "section" | "chapter";
  className?: string;
}) {
  if (!entries.length) return null;

  const visible = entries.slice(0, MAX_VISIBLE);
  const overflow = entries.length - visible.length;

  return (
    <ul
      className={cn(
        "pointer-events-none flex flex-wrap items-center gap-1.5",
        className,
      )}
      aria-label={
        mode === "chapter" ? "هم‌تیمی‌های در حال یادگیری" : "وضعیت هم‌تیمی‌ها"
      }
    >
      {visible.map((e) => {
        const statusLabel =
          mode === "chapter" && e.status === "IN_PROGRESS"
            ? CHAPTER_COPY.IN_PROGRESS
            : STATUS_COPY[e.status];
        const title = `${e.name} — ${STATUS_META[e.status].label}`;
        return (
          <li key={`${e.userId}-${e.status}`}>
            <Badge
              variant={e.status === "DONE" ? "done" : "progress"}
              className="max-w-[12rem] gap-1 px-1.5 py-0.5"
              title={title}
            >
              <Avatar name={e.name} className="h-5 w-5 text-[10px]" />
              <span className="truncate font-medium">{e.name}</span>
              <StatusIcon status={e.status} className="h-3.5 w-3.5" />
              <span className="truncate opacity-90">{statusLabel}</span>
            </Badge>
          </li>
        );
      })}
      {overflow > 0 && (
        <li>
          <Badge variant="neutral" className="px-1.5 py-0.5" title={`${overflow} نفر دیگر`}>
            +{overflow}
          </Badge>
        </li>
      )}
    </ul>
  );
}
