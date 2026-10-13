import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-medium transition active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-white shadow-glow hover:brightness-110",
        dark: "bg-brand-deep text-white hover:brightness-110",
        secondary:
          "bg-surface-raised text-text ring-1 ring-border hover:bg-surface-overlay",
        ghost: "text-text-muted hover:bg-surface-overlay hover:text-text",
        accent: "bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/25",
        danger: "bg-state-danger/10 text-state-danger hover:bg-state-danger/20",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base font-semibold",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
