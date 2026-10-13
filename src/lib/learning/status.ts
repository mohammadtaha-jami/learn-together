import type { ProgressStatus } from "@prisma/client";

export const STATUS_ORDER: ProgressStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
];

export const STATUS_META: Record<
  ProgressStatus,
  { label: string; hint: string }
> = {
  NOT_STARTED: { label: "شروع نشده", hint: "هنوز شروع نکرده‌ای" },
  IN_PROGRESS: { label: "در حال یادگیری", hint: "در حال خواندن این مبحث هستی" },
  DONE: { label: "تمام شد", hint: "این مبحث را یاد گرفته‌ای" },
};

export function nextStatus(current: ProgressStatus): ProgressStatus {
  const i = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

/** Persian digits for display (client-only values, not for SSR text). */
export function fa(n: number | string) {
  return Number(n).toLocaleString("fa-IR");
}
