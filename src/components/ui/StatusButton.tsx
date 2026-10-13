import { Circle, CircleCheck, CircleDot } from "lucide-react";
import type { ProgressStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";
import { STATUS_META } from "@/lib/learning/status";

export function StatusIcon({
  status,
  className,
}: {
  status: ProgressStatus;
  className?: string;
}) {
  const base = "h-6 w-6 transition-colors";
  if (status === "DONE")
    return <CircleCheck className={cn(base, "text-state-done", className)} />;
  if (status === "IN_PROGRESS")
    return <CircleDot className={cn(base, "text-state-progress", className)} />;
  return <Circle className={cn(base, "text-state-idle", className)} />;
}

export function StatusChip({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
        status === "DONE" && "bg-state-done/15 text-state-done",
        status === "IN_PROGRESS" && "bg-state-progress/15 text-state-progress",
        status === "NOT_STARTED" && "bg-surface-overlay text-text-muted",
      )}
    >
      {STATUS_META[status].label}
    </span>
  );
}

/** Round three-state control. Always paired with a text label nearby. */
export function StatusButton({
  status,
  onClick,
  disabled,
}: {
  status: ProgressStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${STATUS_META[status].label} — برای تغییر وضعیت بزنید`}
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 motion-reduce:transition-none",
        status === "DONE" && "bg-state-done/15",
        status === "IN_PROGRESS" && "bg-state-progress/15",
        status === "NOT_STARTED" && "bg-surface-overlay",
      )}
    >
      <StatusIcon status={status} />
    </button>
  );
}
