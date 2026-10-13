"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar } from "@/components/ui/MemberBars";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/dashboard", label: "داشبورد", short: "خانه", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/team", label: "یادگیری تیمی", short: "تیمی", icon: Users },
  { href: "/dashboard/personal", label: "یادگیری شخصی", short: "شخصی", icon: User },
  { href: "/dashboard/prompts", label: "پرامپت‌ساز", short: "پرامپت", icon: Sparkles },
  { href: "/dashboard/history", label: "آمار من", short: "آمار", icon: ChartColumn },
];

function isActive(pathname: string, item: (typeof NAV)[number]) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const name = session?.user?.name || "کاربر";

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] gap-6 p-4 lg:p-6">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col rounded-card bg-surface-raised p-4 shadow-soft ring-1 ring-border/60 lg:flex">
        <Logo href="/dashboard" className="px-2 py-2" />

        <nav className="mt-8 flex flex-col gap-1" aria-label="منوی اصلی">
          {NAV.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-pill px-4 text-sm font-medium transition",
                  active
                    ? "bg-brand-primary text-white shadow-glow"
                    : "text-text-muted hover:bg-surface-overlay hover:text-text",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-surface-overlay/60 p-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar name={name} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="truncate text-xs text-text-muted" dir="ltr">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-pill text-sm text-text-muted ring-1 ring-border transition hover:bg-surface-overlay hover:text-text"
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-6">
        {/* Top bar (mobile) */}
        <div className="mb-5 flex items-center justify-between lg:hidden">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="خروج از حساب"
              className="grid h-11 w-11 place-items-center rounded-full bg-surface-raised text-text-muted ring-1 ring-border"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <main>{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-card bg-surface-raised/95 p-1.5 shadow-float ring-1 ring-border backdrop-blur-xl lg:hidden"
        aria-label="منوی اصلی"
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[3.5rem] flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition",
                active
                  ? "bg-brand-primary text-white"
                  : "text-text-muted hover:text-text",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
