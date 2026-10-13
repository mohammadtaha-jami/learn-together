import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-overlay text-text-muted",
        team: "bg-brand-primary/15 text-brand-primary",
        personal: "bg-brand-accent/15 text-brand-accent",
        idle: "bg-surface-overlay text-text-muted",
        progress: "bg-state-progress/15 text-state-progress",
        done: "bg-state-done/15 text-state-done",
        danger: "bg-state-danger/10 text-state-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
