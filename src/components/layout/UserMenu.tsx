"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { EllipsisVertical, LogOut, UserRound, Users } from "lucide-react";
import { Avatar } from "@/components/ui/MemberBars";
import { cn } from "@/lib/utils/cn";

export function UserMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name || "کاربر";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: "/dashboard/profile", label: "اطلاعات پروفایل", icon: UserRound },
    { href: "/dashboard/profile#teams", label: "تیم‌های من", icon: Users },
  ];

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-2xl bg-surface-overlay/60 p-2.5">
        <Link href="/dashboard/profile" className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar name={name} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-text-muted" dir="ltr">
              {session?.user?.email}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="منوی حساب کاربری"
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-text-muted transition hover:bg-surface-raised hover:text-text",
            open && "bg-surface-raised text-text",
          )}
        >
          <EllipsisVertical className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-2xl bg-surface-raised p-1.5 shadow-float ring-1 ring-border/60"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition hover:bg-surface-overlay"
            >
              <item.icon className="h-4 w-4 text-text-muted" />
              {item.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-state-danger transition hover:bg-state-danger/10"
          >
            <LogOut className="h-4 w-4" />
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}
