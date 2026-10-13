import Link from "next/link";
import { LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { buttonVariants } from "@/components/ui/Button";

const links = [
  { href: "/#features", label: "امکانات" },
  { href: "/#how", label: "چطور کار می‌کند" },
];

export async function SiteHeader() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-pill px-4 py-2 text-sm text-text-muted transition hover:bg-surface-overlay hover:text-text"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loggedIn ? (
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              <LayoutDashboard className="h-4 w-4" />
              داشبورد
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "md" })}
              >
                <LogIn className="h-4 w-4" />
                ورود
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "primary", size: "md" })}
              >
                <UserPlus className="h-4 w-4" />
                ثبت‌نام
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
