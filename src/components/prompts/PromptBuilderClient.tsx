"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, History, ListChecks, Save, Sparkles } from "lucide-react";
import { MasterPromptPanel } from "@/components/prompts/MasterPromptPanel";
import {
  BUILTIN_MASTER_PROMPT_ID,
  combineMasterPrompt,
} from "@/lib/prompts/combine-master-prompt";
import { MASTER_PROMPT } from "@/lib/prompts/master-prompt";
import {
  buildSectionTree,
  formatSectionLines,
  getLeafSections,
  type SectionNode,
} from "@/lib/learning/section-tree";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ClientDateTime } from "@/components/ui/ClientDateTime";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";
import { fa } from "@/lib/learning/status";
import type { TopicSummary } from "@/lib/learning/overview";

type TopicDetail = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  chapters: {
    id: string;
    number: string | null;
    titleEn: string;
    titleFa: string | null;
    sections: SectionNode[];
  }[];
};

const nodeLabel = (n: SectionNode) => n.titleFa?.trim() || n.titleEn;

export function PromptBuilderClient() {
  const qc = useQueryClient();
  const [topicId, setTopicId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emphasis, setEmphasis] = useState("");
  const [masterId, setMasterId] = useState(BUILTIN_MASTER_PROMPT_ID);
  const [showSessionOnly, setShowSessionOnly] = useState(false);

  const { data: topics } = useQuery({
    queryKey: ["topics", "prompt-builder"],
    queryFn: async () => {
      const res = await fetch("/api/topics");
      if (!res.ok) return [];
      return (await res.json()) as TopicSummary[];
    },
  });

  const { data: customMasters } = useQuery({
    queryKey: ["master-prompts"],
    queryFn: async () => {
      const res = await fetch("/api/master-prompts");
      if (!res.ok) return [];
      return (await res.json()) as { id: string; body: string; topicId: string | null }[];
    },
  });

  const { data: topic } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as TopicDetail;
    },
    enabled: !!topicId,
  });

  useEffect(() => {
    if (!topicId || !customMasters?.length) return;
    const match = customMasters.find((m) => m.topicId === topicId);
    if (match) setMasterId(match.id);
  }, [topicId, customMasters]);

  const masterTemplate = useMemo(() => {
    if (masterId === BUILTIN_MASTER_PROMPT_ID) return MASTER_PROMPT;
    return customMasters?.find((m) => m.id === masterId)?.body ?? MASTER_PROMPT;
  }, [masterId, customMasters]);

  const chapter = topic?.chapters.find((c) => c.id === chapterId);
  const tree = useMemo(
    () => (chapter ? buildSectionTree(chapter.sections) : []),
    [chapter],
  );
  const allIds = useMemo(
    () => (chapter ? chapter.sections.map((s) => s.id) : []),
    [chapter],
  );

  const topicTitle = topic?.titleFa?.trim() || topic?.titleEn || "";

  const { combined, sessionBlock } = useMemo(() => {
    if (!chapter || selected.size === 0) {
      return { combined: "", sessionBlock: "" };
    }
    return combineMasterPrompt({
      masterTemplate,
      topicTitle,
      chapterNumber: chapter.number,
      chapterTitleEn: chapter.titleEn,
      chapterTitleFa: chapter.titleFa,
      sectionLines: formatSectionLines(tree, selected),
      emphasis,
    });
  }, [chapter, tree, selected, emphasis, masterTemplate, topicTitle]);

  const displayOutput = showSessionOnly ? sessionBlock : combined;

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          sectionIds: Array.from(selected),
          emphasis,
          content: combined,
          masterPromptId: masterId === BUILTIN_MASTER_PROMPT_ID ? null : masterId,
        }),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts-history"] }),
  });

  const { data: history } = useQuery({
    queryKey: ["prompts-history"],
    queryFn: async () => {
      const res = await fetch("/api/prompts");
      if (!res.ok) return [];
      return (await res.json()) as {
        id: string;
        content: string;
        createdAt: string;
        chapter: { titleEn: string; titleFa: string | null };
      }[];
    },
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function renderNodes(nodes: SectionNode[], depth = 0): React.ReactNode {
    return nodes.map((n) => {
      const on = selected.has(n.id);
      return (
        <div key={n.id}>
          <button
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(n.id)}
            style={{ paddingInlineStart: 12 + depth * 20 }}
            className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl pe-3 text-start text-sm transition hover:bg-surface-overlay/70"
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-1 transition",
                on ? "bg-brand-primary text-white ring-brand-primary" : "ring-border",
              )}
            >
              {on && <Check className="h-4 w-4" />}
            </span>
            <span dir="auto">{nodeLabel(n)}</span>
          </button>
          {n.children?.length ? renderNodes(n.children, depth + 1) : null}
        </div>
      );
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="پرامپت‌ساز"
        subtitle="قالب Master خود را انتخاب کنید، مباحث جلسه را مشخص کنید و پرامپت نهایی را کپی کنید."
      />

      <MasterPromptPanel
        topics={topics}
        activeTopicId={topicId}
        selectedMasterId={masterId}
        onSelectMaster={setMasterId}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle icon={<ListChecks className="h-5 w-5 text-brand-primary" />}>
            ۱. موضوع و مباحث جلسه
          </CardTitle>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">موضوع</span>
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setChapterId("");
                setSelected(new Set());
              }}
              className={inputClass}
            >
              <option value="">انتخاب کنید…</option>
              {topics?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titleFa?.trim() || t.titleEn}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">سرفصل</span>
            <select
              value={chapterId}
              onChange={(e) => {
                setChapterId(e.target.value);
                setSelected(new Set());
              }}
              disabled={!topic}
              className={cn(inputClass, "disabled:opacity-50")}
            >
              <option value="">انتخاب کنید…</option>
              {topic?.chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number ? `${c.number} · ` : ""}
                  {c.titleFa?.trim() || c.titleEn}
                </option>
              ))}
            </select>
          </label>

          {chapter && (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-text-muted">{fa(selected.size)} مورد انتخاب شده</span>
                <span className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSelected(
                        new Set(getLeafSections(chapter.sections).map((l) => l.id)),
                      )
                    }
                  >
                    انتخاب همه
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(new Set())}
                    disabled={!selected.size}
                  >
                    پاک کردن
                  </Button>
                </span>
              </div>
              <div className="scrollbar-app max-h-80 overflow-y-auto rounded-2xl bg-surface-overlay/40 p-1.5 pe-0.5">
                {allIds.length ? (
                  renderNodes(tree)
                ) : (
                  <p className="p-4 text-sm text-text-muted">این سرفصل مبحثی ندارد.</p>
                )}
              </div>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-medium">تأکید ویژه (اختیاری)</span>
            <input
              value={emphasis}
              onChange={(e) => setEmphasis(e.target.value)}
              placeholder="مثلاً: بیشتر مثال بزن"
              className={inputClass}
            />
          </label>
        </Card>

        <Card variant="flat" className="flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <CardTitle icon={<Sparkles className="h-5 w-5 text-brand-primary" />}>
              ۲. پرامپت نهایی
            </CardTitle>
            <div className="flex rounded-pill bg-surface-raised p-1 ring-1 ring-border/60">
              <button
                type="button"
                onClick={() => setShowSessionOnly(false)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-medium transition",
                  !showSessionOnly
                    ? "bg-brand-primary text-white"
                    : "text-text-muted hover:text-text",
                )}
              >
                ترکیب کامل
              </button>
              <button
                type="button"
                onClick={() => setShowSessionOnly(true)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-medium transition",
                  showSessionOnly
                    ? "bg-brand-primary text-white"
                    : "text-text-muted hover:text-text",
                )}
              >
                فقط بلوک جلسه
              </button>
            </div>
          </div>

          {displayOutput ? (
            <>
              <p className="mb-2 text-xs text-text-muted">
                {showSessionOnly
                  ? "بلوک جلسه برای پیام‌های بعد از Master."
                  : "Master انتخاب‌شده + متغیرهای پر شده با مباحث این جلسه."}
              </p>
              <pre
                className="scrollbar-app min-h-[220px] max-h-[min(50vh,28rem)] flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-surface-raised p-4 text-sm leading-7 ring-1 ring-border/50"
                dir="auto"
              >
                {displayOutput}
              </pre>
              <div className="mt-4 flex flex-wrap gap-3">
                <CopyButton text={combined} label="کپی پرامپت نهایی" variant="primary" />
                <Button
                  variant="secondary"
                  disabled={save.isPending || save.isSuccess || !combined}
                  onClick={() => save.mutate()}
                >
                  {save.isSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {save.isSuccess ? "ذخیره شد" : "ذخیره در تاریخچه"}
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<ListChecks className="h-6 w-6" />}
              title="هنوز چیزی انتخاب نشده"
              description="موضوع، سرفصل و چند مبحث انتخاب کنید تا پرامپت ترکیب‌شده اینجا ساخته شود."
              className="flex-1 bg-surface-raised/50"
            />
          )}
        </Card>
      </div>

      {history && history.length > 0 && (
        <Card>
          <CardTitle icon={<History className="h-5 w-5 text-brand-primary" />}>
            تاریخچهٔ پرامپت‌ها
          </CardTitle>
          <ul className="grid gap-3 md:grid-cols-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-2xl bg-surface-overlay/50 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                  <span className="truncate" dir="auto">
                    {h.chapter.titleFa?.trim() || h.chapter.titleEn}
                  </span>
                  <ClientDateTime iso={h.createdAt} />
                </div>
                <pre
                  className="scrollbar-app mt-2 max-h-28 overflow-y-auto whitespace-pre-wrap text-xs leading-6 text-text-muted"
                  dir="auto"
                >
                  {h.content}
                </pre>
                <CopyButton text={h.content} variant="secondary" className="mt-3" />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
