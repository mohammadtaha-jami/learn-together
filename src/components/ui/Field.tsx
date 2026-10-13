import { cn } from "@/lib/utils/cn";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
};

export function Field({ label, icon, className, id, ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 start-3 grid place-items-center text-text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "h-12 w-full rounded-2xl bg-surface-overlay px-4 text-base outline-none ring-1 ring-transparent transition placeholder:text-text-muted/70 focus:bg-surface-raised focus:ring-2 focus:ring-brand-primary/60",
            icon && "ps-11",
            className,
          )}
          {...props}
        />
      </span>
    </label>
  );
}

export const inputClass =
  "h-12 w-full rounded-2xl bg-surface-overlay px-4 text-base outline-none ring-1 ring-transparent transition placeholder:text-text-muted/70 focus:bg-surface-raised focus:ring-2 focus:ring-brand-primary/60";
