import { cn } from "@/lib/utils/cn";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fa } from "@/lib/learning/status";

export type MemberProgress = {
  id: string;
  name: string;
  percent: number;
  isMe?: boolean;
};

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-primary/15 text-sm font-bold text-brand-primary",
        className,
      )}
      aria-hidden
    >
      {name.trim().charAt(0) || "؟"}
    </span>
  );
}

/** One row per member: avatar, name, bar and percent — easy to compare. */
export function MemberBars({ members }: { members: MemberProgress[] }) {
  return (
    <ul className="space-y-4">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-3">
          <Avatar name={m.name} />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium">
                {m.name}
                {m.isMe && (
                  <span className="ms-2 text-xs font-normal text-text-muted">
                    (شما)
                  </span>
                )}
              </span>
              <span className="tabular-nums text-text-muted">
                {fa(m.percent)}٪
              </span>
            </div>
            <ProgressBar value={m.percent} size="sm" />
          </div>
        </li>
      ))}
    </ul>
  );
}
