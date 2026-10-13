import { cn } from "@/lib/utils/cn";

export function ProgressRing({
  value,
  size = 112,
  stroke = 9,
  tone = "default",
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "default" | "inverse";
  className?: string;
  children?: React.ReactNode;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct)} درصد`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={tone === "inverse" ? "stroke-white/20" : "stroke-surface-overlay"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-700 motion-reduce:transition-none",
            tone === "inverse" ? "stroke-white" : "stroke-brand-primary",
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
