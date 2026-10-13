import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  value,
  className,
  tone = "default",
  size = "md",
  label,
}: {
  value: number;
  className?: string;
  tone?: "default" | "done" | "inverse";
  size?: "sm" | "md";
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-pill",
        size === "sm" ? "h-1.5" : "h-2.5",
        tone === "inverse" ? "bg-white/20" : "bg-surface-overlay",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-pill transition-all duration-500 motion-reduce:transition-none",
          tone === "inverse" && "bg-white",
          tone === "done" && "bg-state-done",
          tone === "default" &&
            (pct >= 100
              ? "bg-state-done"
              : "bg-gradient-to-l from-brand-accent to-brand-primary"),
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
