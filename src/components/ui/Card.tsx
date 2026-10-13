import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const cardVariants = cva("rounded-card", {
  variants: {
    variant: {
      default: "bg-surface-raised p-5 shadow-soft ring-1 ring-border/60 md:p-6",
      flat: "bg-surface-overlay/60 p-5",
      focal:
        "bg-gradient-to-br from-brand-primary to-brand-deep p-5 text-white shadow-float md:p-6",
    },
  },
  defaultVariants: { variant: "default" },
});

type CardProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof cardVariants> & { as?: "div" | "section" | "article" };

export function Card({
  as: Tag = "div",
  variant,
  className,
  ...props
}: CardProps) {
  return <Tag className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardTitle({
  icon,
  children,
  action,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}
