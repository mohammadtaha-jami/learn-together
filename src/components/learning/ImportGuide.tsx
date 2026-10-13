"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Braces, ChevronDown, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { cn } from "@/lib/utils/cn";

export const TEMPLATE_URL = "/templates/topic-import-template.json";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      dir="ltr"
      className="mx-0.5 inline-block rounded-md bg-brand-primary/10 px-1.5 py-0.5 font-mono text-xs text-brand-primary"
    >
      {children}
    </code>
  );
}

const STRUCTURE = `{
  "topic": { "titleEn": "...", "titleFa": "..." },
  "parts": [
    {
      "partLabel": "بخش اول",
      "chapters": [
        {
          "number": "Ch.1",
          "titleEn": "Introduction",
          "sections": [
            { "titleEn": "Leaf topic" },
            {
              "titleEn": "Topic with children",
              "subsections": ["Child A", "Child B"]
            }
          ]
        }
      ]
    }
  ]
}`;

const STEPS: { title: string; body: React.ReactNode }[] = [
  {
    title: "اطلاعات موضوع",
    body: (
      <>
        در بالای فایل، شیء <Code>topic</Code> با <Code>titleEn</Code> (الزامی) و <Code>titleFa</Code> /{" "}
        <Code>description</Code> (اختیاری). اگر فایل فقط آرایهٔ بخش‌هاست، عنوان را در فرم پایین بنویسید.
      </>
    ),
  },
  {
    title: "بخش‌ها (Part)",
    body: (
      <>
        آرایهٔ <Code>parts</Code>؛ هر بخش یک <Code>partLabel</Code> دارد و در صفحهٔ موضوع به‌صورت سرگروه
        بالای سرفصل‌هایش نمایش داده می‌شود.
      </>
    ),
  },
  {
    title: "سرفصل‌ها و ترتیب",
    body: (
      <>
        هر بخش آرایهٔ <Code>chapters</Code> دارد. <strong className="text-text">ترتیب نمایش = ترتیب در فایل</strong>.
        فیلد <Code>number</Code> (مثل <Code>Ch.1</Code>) فقط برچسب است.
      </>
    ),
  },
  {
    title: "مباحث و زیرمباحث",
    body: (
      <>
        هر سرفصل آرایهٔ <Code>sections</Code> دارد. زیرمباحث در <Code>subsections</Code> به‌صورت متن ساده یا
        شیء <Code>{"{ titleEn, titleFa }"}</Code> می‌آیند. پیشرفت روی آخرین سطح ثبت می‌شود: اگر مبحثی
        زیرمبحث دارد، روی زیرمبحث‌ها تیک می‌زنید.
      </>
    ),
  },
  {
    title: "نکات نام‌گذاری",
    body: (
      <>
        <Code>title_en</Code> و <Code>title_fa</Code> هم پذیرفته می‌شوند. فایل باید UTF-8 با پسوند{" "}
        <Code>.json</Code> و حداکثر ۵ مگابایت باشد. تورفتگی (indent) دلخواه است؛ ساختار تودرتو مهم است.
      </>
    ),
  },
];

function highlightJsonLine(line: string, keyPrefix: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(\{|\}|\[|\]|,)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const key = `${keyPrefix}-${match.index}`;
    if (match[1] && match[2]) {
      parts.push(
        <span key={`${key}-k`} className="font-medium text-brand-primary">
          {match[1]}
        </span>,
      );
      parts.push(<span key={`${key}-c`} className="text-text-muted">{match[2]}</span>);
    } else if (match[1]) {
      parts.push(
        <span key={`${key}-s`} className="text-brand-accent">
          {match[1]}
        </span>,
      );
    } else if (match[3]) {
      parts.push(
        <span key={`${key}-p`} className="text-brand-deep/80 dark:text-brand-accent/90">
          {match[3]}
        </span>,
      );
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }
  return parts;
}

function JsonStructureSample({ source }: { source: string }) {
  const lines = useMemo(() => source.split("\n"), [source]);

  return (
    <div
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary/[0.06] via-surface-raised to-brand-accent/[0.05] ring-1 ring-brand-primary/20 shadow-soft"
      dir="ltr"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-surface-overlay/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-state-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-state-progress/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-state-done/80" />
          </span>
          <span className="flex items-center gap-2 truncate text-xs font-medium text-text-muted">
            <Braces className="h-4 w-4 shrink-0 text-brand-primary" />
            <span className="truncate font-mono">topic-structure.json</span>
          </span>
        </div>
        <CopyButton
          text={source}
          label="کپی نمونه"
          variant="secondary"
          className="h-9 shrink-0 px-3 text-xs"
        />
      </div>

      <div className="max-h-[min(28rem,70vh)] overflow-auto">
        <pre className="p-4 text-start font-mono text-[13px] leading-[1.65] sm:p-5 sm:text-sm">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-0 hover:bg-brand-primary/[0.04]">
              <span
                className="w-9 shrink-0 select-none pe-3 text-end text-[11px] tabular-nums text-text-muted/45 sm:w-10"
                aria-hidden
              >
                {i + 1}
              </span>
              <code className="min-w-0 flex-1 whitespace-pre text-text/90">{highlightJsonLine(line, i)}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export function ImportGuide() {
  const [open, setOpen] = useState(true);

  return (
    <Card className="overflow-hidden p-0 md:p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-brand-primary/[0.07] px-5 py-4 text-start transition hover:bg-brand-primary/10 md:px-6"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-primary text-white shadow-glow">
            <BookOpen className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold">راهنمای ساختار فایل JSON</span>
            <span className="block text-xs text-text-muted">ترتیب، تورفتگی و نام‌گذاری سرفصل‌ها</span>
          </span>
        </span>
        <ChevronDown className={cn("h-5 w-5 text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-8 p-5 md:p-6">
          <ol className="relative grid gap-5 text-sm leading-7 text-text-muted sm:grid-cols-2">
            <span
              aria-hidden
              className="absolute bottom-3 start-[15px] top-3 hidden w-px bg-border sm:block"
            />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 sm:col-span-1">
                <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-bold text-brand-primary ring-2 ring-brand-primary/30">
                  {(i + 1).toLocaleString("fa-IR")}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-text">{s.title}</p>
                  <p>{s.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <section className="w-full space-y-3 border-t border-border/60 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-text">نمونهٔ ساختار</h3>
                <p className="mt-1 text-sm text-text-muted">
                  همان شکلی که فایل شما باید داشته باشد — کلیدها، آرایه‌ها و تورفتگی
                </p>
              </div>
              <Link
                href={TEMPLATE_URL}
                download
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                <Download className="h-4 w-4" />
                دانلود فایل نمونهٔ کامل
              </Link>
            </div>
            <JsonStructureSample source={STRUCTURE} />
          </section>
        </div>
      )}
    </Card>
  );
}
