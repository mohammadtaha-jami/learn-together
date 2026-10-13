import { Card } from "@/components/ui/Card";

export function AuthCard({
  title,
  subtitle,
  icon,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-md p-7 md:p-8">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
        {icon}
      </span>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && (
        <p className="mt-6 text-center text-sm text-text-muted">{footer}</p>
      )}
    </Card>
  );
}
