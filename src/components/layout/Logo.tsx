import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-primary to-brand-deep text-white shadow-glow">
        <BookOpen className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight" dir="ltr">
        Learn Together
      </span>
    </Link>
  );
}
