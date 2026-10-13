import Link from "next/link";
import {
  ArrowRight,
  ChartColumn,
  ListChecks,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { Backdrop } from "@/components/layout/Backdrop";
import { Logo } from "@/components/layout/Logo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatusChip, StatusIcon } from "@/components/ui/StatusButton";

const features = [
  {
    icon: ListChecks,
    title: "چک‌لیست سه‌حالته",
    text: "هر مبحث را خاکستری، زرد یا سبز کنید تا همیشه بدانید کجای کتاب هستید.",
  },
  {
    icon: Users,
    title: "یادگیری تیمی",
    text: "با یک کد دعوت، هم‌تیمی‌تان را اضافه کنید و پیشرفت هم را کنار هم ببینید.",
  },
  {
    icon: Sparkles,
    title: "پرامپت‌ساز",
    text: "مباحث انتخاب‌شده را به یک پرامپت آمادهٔ آموزشی تبدیل کنید و کپی کنید.",
  },
  {
    icon: ChartColumn,
    title: "آمار روزانه",
    text: "ببینید امروز چند مبحث تمام کردید و چند روز پشت‌سرهم مطالعه داشته‌اید.",
  },
];

const steps = [
  { n: "۱", title: "تیم بسازید", text: "تیم جدید بسازید یا با کد دعوت به تیم بپیوندید." },
  { n: "۲", title: "موضوع را انتخاب کنید", text: "کتاب یا موضوع مشترک را باز کنید و سرفصل‌ها را ببینید." },
  { n: "۳", title: "هر روز تیک بزنید", text: "مباحثی که خوانده‌اید را علامت بزنید تا پیشرفت ثبت شود." },
];

export default async function HomePage() {
  const session = await auth();
  const loggedIn = !!session?.user;

  return (
    <div className="min-h-screen">
      <Backdrop />
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-pill bg-brand-primary/10 px-4 py-1.5 text-sm font-medium text-brand-primary">
              <Sparkles className="h-4 w-4" />
              یادگیری روزانه، با هم
            </span>
            <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.4] md:text-5xl md:leading-[1.35]">
              هر روز یک قدم؛
              <br />
              <span className="text-brand-primary">یک کتاب را با هم تمام کنید</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-text-muted">
              سرفصل‌های کتاب را ببینید، مباحث خوانده‌شده را تیک بزنید و پیشرفت
              خودتان و هم‌تیمی‌تان را در یک نگاه دنبال کنید.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={loggedIn ? "/dashboard" : "/register"}
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                {loggedIn ? "رفتن به داشبورد" : "شروع رایگان"}
                <ArrowRight className="h-5 w-5 rotate-180" />
              </Link>
              {!loggedIn && (
                <Link
                  href="/login"
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  وارد شوید
                </Link>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="grid gap-4 sm:grid-cols-5">
            <Card variant="focal" className="sm:col-span-3">
              <p className="text-sm text-white/80">پیشرفت کل کتاب</p>
              <div className="mt-4 flex items-center gap-5">
                <ProgressRing value={68} tone="inverse" size={104}>
                  <span className="text-2xl font-bold tabular-nums">۶۸٪</span>
                </ProgressRing>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-2xl font-bold tabular-nums">۱۴۲</span>{" "}
                    مبحث تمام شده
                  </p>
                  <p className="text-white/80">۶۷ مبحث باقی‌مانده</p>
                </div>
              </div>
            </Card>
            <Card className="sm:col-span-2">
              <p className="text-sm text-text-muted">این هفته</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">۱۸</p>
              <p className="text-sm text-text-muted">مبحث تمام شد</p>
              <div className="mt-4 flex h-12 items-end gap-1.5" aria-hidden>
                {[40, 65, 30, 80, 55, 90, 70].map((h, i) => (
                  <span
                    key={i}
                    className="w-full rounded-full bg-brand-primary/70"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </Card>
            <Card className="sm:col-span-5">
              <p className="mb-3 text-sm font-semibold">مباحث امروز</p>
              <ul className="space-y-2.5">
                {[
                  { t: "Architecture Characteristics", s: "DONE" as const },
                  { t: "Measuring Architecture Characteristics", s: "IN_PROGRESS" as const },
                  { t: "Scope of Architecture Characteristics", s: "NOT_STARTED" as const },
                ].map((i) => (
                  <li
                    key={i.t}
                    className="flex items-center gap-3 rounded-2xl bg-surface-overlay/60 px-3 py-2.5"
                  >
                    <StatusIcon status={i.s} />
                    <span className="min-w-0 flex-1 truncate text-sm" dir="ltr">
                      {i.t}
                    </span>
                    <StatusChip status={i.s} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
          <h2 className="text-2xl font-bold md:text-3xl">همه‌چیز برای مطالعهٔ روزانه</h2>
          <p className="mt-2 text-text-muted">ساده، سریع و بدون شلوغی.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="transition hover:-translate-y-0.5 hover:shadow-float">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm leading-7 text-text-muted">{f.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
          <h2 className="text-2xl font-bold md:text-3xl">چطور کار می‌کند؟</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <Card key={s.n} variant="flat" className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-primary text-lg font-bold text-white">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-text-muted">{s.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <Card variant="focal" className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">امروز شروع کنید</h2>
              <p className="mt-1 text-white/80">ثبت‌نام چند ثانیه بیشتر طول نمی‌کشد.</p>
            </div>
            <Link
              href={loggedIn ? "/dashboard" : "/register"}
              className="inline-flex h-12 items-center gap-2 rounded-pill bg-white px-6 font-semibold text-brand-deep transition hover:bg-white/90"
            >
              {loggedIn ? "داشبورد" : "ساخت حساب"}
            </Link>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-text-muted">
          <Logo />
          <p>ساخته‌شده برای یادگیری روزانهٔ تیمی</p>
        </div>
      </footer>
    </div>
  );
}
