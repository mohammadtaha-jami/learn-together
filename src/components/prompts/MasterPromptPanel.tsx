"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookMarked,
  ChevronDown,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MASTER_PROMPT } from "@/lib/prompts/master-prompt";
import {
  BUILTIN_MASTER_PROMPT_ID,
  PROMPT_PLACEHOLDERS,
} from "@/lib/prompts/combine-master-prompt";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, inputClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TopicSummary } from "@/lib/learning/overview";
import { cn } from "@/lib/utils/cn";

export type MasterPromptItem = {
  id: string;
  name: string;
  body: string;
  topicId: string | null;
  topic?: { id: string; titleEn: string; titleFa: string | null } | null;
};

type FormState = {
  id?: string;
  name: string;
  body: string;
  topicId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  body: "",
  topicId: "",
});

export function MasterPromptPanel({
  topics,
  activeTopicId,
  selectedMasterId,
  onSelectMaster,
}: {
  topics?: TopicSummary[];
  activeTopicId: string;
  selectedMasterId: string;
  onSelectMaster: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [manageOpen, setManageOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MasterPromptItem | null>(null);

  const { data: custom, isLoading } = useQuery({
    queryKey: ["master-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/master-prompts");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as MasterPromptItem[];
    },
  });

  const options = [
    {
      id: BUILTIN_MASTER_PROMPT_ID,
      name: "پیش‌فرض (کتاب FSA)",
      body: MASTER_PROMPT,
      topicId: null as string | null,
    },
    ...(custom ?? []),
  ];

  const visibleOptions = options.filter(
    (o) =>
      o.id === BUILTIN_MASTER_PROMPT_ID ||
      !activeTopicId ||
      !o.topicId ||
      o.topicId === activeTopicId,
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["master-prompts"] });

  const save = useMutation({
    mutationFn: async (payload: FormState) => {
      const url = payload.id
        ? `/api/master-prompts/${payload.id}`
        : "/api/master-prompts";
      const res = await fetch(url, {
        method: payload.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name,
          body: payload.body,
          topicId: payload.topicId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ذخیره نشد");
      return json as MasterPromptItem;
    },
    onSuccess: (row) => {
      refresh();
      setFormOpen(false);
      onSelectMaster(row.id);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master-prompts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("حذف نشد");
    },
    onSuccess: (_data, id) => {
      refresh();
      setDeleteTarget(null);
      if (selectedMasterId === id) {
        onSelectMaster(BUILTIN_MASTER_PROMPT_ID);
      }
    },
  });

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle icon={<Sparkles className="h-5 w-5 text-brand-primary" />}>
            پرامپت اصلی (Master)
          </CardTitle>
          <p className="mt-1 text-sm text-text-muted">
            یک قالب ثابت انتخاب کنید؛ مباحث جلسه در جای متغیرها قرار می‌گیرند.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setManageOpen((o) => !o)}>
          <BookMarked className="h-4 w-4" />
          {manageOpen ? "بستن مدیریت" : "مدیریت قالب‌ها"}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-12" />
      ) : (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="انتخاب پرامپت اصلی">
          {visibleOptions.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selectedMasterId === o.id}
              onClick={() => onSelectMaster(o.id)}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-pill px-4 py-2.5 text-sm font-medium transition",
                selectedMasterId === o.id
                  ? "bg-brand-primary text-white shadow-glow"
                  : "bg-surface-raised text-text-muted ring-1 ring-border/60 hover:text-text",
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="truncate">{o.name}</span>
            </button>
          ))}
        </div>
      )}

      {manageOpen && (
        <div className="space-y-4 rounded-2xl bg-brand-primary/[0.06] p-4 ring-1 ring-brand-primary/15">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">قالب‌های شخصی شما</p>
            <Button
              size="sm"
              onClick={() => {
                setForm(emptyForm());
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              قالب جدید
            </Button>
          </div>

          <details className="rounded-2xl bg-surface-raised/80 p-3 text-sm ring-1 ring-border/50">
            <summary className="cursor-pointer font-medium text-text">
              راهنمای متغیرها
            </summary>
            <ul className="mt-3 space-y-2 text-text-muted">
              {PROMPT_PLACEHOLDERS.map((p) => (
                <li key={p.key}>
                  <code dir="ltr" className="rounded-md bg-brand-primary/10 px-1.5 py-0.5 text-xs text-brand-primary">
                    {p.key}
                  </code>
                  <span className="ms-2">{p.desc}</span>
                </li>
              ))}
            </ul>
          </details>

          {!custom?.length ? (
            <EmptyState
              icon={<BookMarked className="h-6 w-6" />}
              title="هنوز قالب شخصی ندارید"
              description="از «قالب جدید» یک Master Prompt مخصوص موضوع یا کتاب خود بسازید."
              className="py-6"
            />
          ) : (
            <ul className="scrollbar-app max-h-56 space-y-2 overflow-y-auto pe-1">
              {custom.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface-raised p-3 ring-1 ring-border/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-text-muted">
                      {m.topic
                        ? `موضوع: ${m.topic.titleFa?.trim() || m.topic.titleEn}`
                        : "همهٔ موضوعات"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setForm({
                          id: m.id,
                          name: m.name,
                          body: m.body,
                          topicId: m.topicId ?? "",
                        });
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPreview((o) => !o)}
        aria-expanded={showPreview}
        className="flex w-full items-center justify-between gap-2 rounded-2xl bg-surface-overlay/50 px-4 py-3 text-start text-sm text-text-muted transition hover:bg-surface-overlay"
      >
        <span>پیش‌نمایش قالب انتخاب‌شده</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", showPreview && "rotate-180")}
        />
      </button>
      {showPreview && (
        <pre
          className="scrollbar-app max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-overlay/60 p-4 text-xs leading-6 text-text-muted"
          dir="auto"
        >
          {options.find((o) => o.id === selectedMasterId)?.body ?? MASTER_PROMPT}
        </pre>
      )}

      <Modal
        open={formOpen}
        onClose={() => !save.isPending && setFormOpen(false)}
        title={form.id ? "ویرایش قالب" : "قالب Master جدید"}
        icon={<Sparkles className="h-5 w-5" />}
      >
        <div className="space-y-4">
          <Field
            label="نام قالب"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="مثلاً: معلم معماری — جلسهٔ تیمی"
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">موضوع مرتبط (اختیاری)</span>
            <select
              value={form.topicId}
              onChange={(e) => setForm((f) => ({ ...f, topicId: e.target.value }))}
              className={inputClass}
            >
              <option value="">همهٔ موضوعات</option>
              {topics?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleFa?.trim() || t.titleEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">متن Master Prompt</span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={12}
              className={cn(
                inputClass,
                "scrollbar-app h-auto max-h-64 min-h-[12rem] resize-y py-3 font-mono text-xs leading-6",
              )}
              dir="auto"
              placeholder="قالب Master خود را اینجا بنویسید. برای مباحث جلسه از {{SESSION}} یا [لیست زیرعنوان‌های انتخاب‌شده] استفاده کنید."
            />
          </label>
          <p className="text-xs leading-6 text-text-muted">
            برای درج خودکار مباحث جلسه از{" "}
            <code dir="ltr" className="text-brand-primary">{"{{SESSION}}"}</code> یا{" "}
            <code dir="ltr" className="text-brand-primary">[لیست زیرعنوان‌های انتخاب‌شده]</code>{" "}
            استفاده کنید.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              انصراف
            </Button>
            <Button
              disabled={save.isPending}
              onClick={() => save.mutate(form)}
            >
              {save.isPending ? "در حال ذخیره…" : "ذخیره قالب"}
            </Button>
          </div>
          {save.error && (
            <p className="text-sm text-state-danger">{(save.error as Error).message}</p>
          )}
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => !remove.isPending && setDeleteTarget(null)}
        title="حذف قالب"
        icon={<Trash2 className="h-5 w-5" />}
      >
        <p className="text-sm text-text-muted">
          قالب <strong className="text-text">«{deleteTarget?.name}»</strong> حذف شود؟
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            انصراف
          </Button>
          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
          >
            حذف
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
