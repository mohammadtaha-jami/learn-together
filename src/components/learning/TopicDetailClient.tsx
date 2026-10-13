"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Pencil,
  Play,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import type { ProgressStatus, TopicScope } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { inputClass } from "@/components/ui/Field";
import { MemberBars } from "@/components/ui/MemberBars";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusChip, StatusIcon } from "@/components/ui/StatusButton";
import {
  buildSectionTree,
  getLeafSections,
  type SectionNode,
} from "@/lib/learning/section-tree";
import { fa, nextStatus, STATUS_META } from "@/lib/learning/status";
import { cn } from "@/lib/utils/cn";

type SectionFlat = {
  id: string;
  chapterId: string;
  parentId: string | null;
  titleEn: string;
  titleFa: string | null;
  sortOrder: number;
};

type Chapter = {
  id: string;
  number: string | null;
  titleEn: string;
  titleFa: string | null;
  partLabel: string | null;
  sortOrder: number;
  sections: SectionFlat[];
};

type Topic = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  description: string | null;
  scope: TopicScope;
  chapters: Chapter[];
};

type ProgressData = {
  progress: { sectionId: string; status: ProgressStatus }[];
  membersSummary: { userId: string; name: string; percent: number }[];
};

type Filter = "ALL" | ProgressStatus;
type StatusMap = Map<string, ProgressStatus>;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "ALL", label: "همه" },
  { id: "IN_PROGRESS", label: "در حال یادگیری" },
  { id: "DONE", label: "تمام شده" },
  { id: "NOT_STARTED", label: "شروع نشده" },
];

const cleanPart = (s: string) => s.replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, "").trim();
const label = (n: { titleEn: string; titleFa: string | null }) =>
  n.titleFa?.trim() || n.titleEn;

function leavesUnder(node: SectionNode): SectionNode[] {
  if (!node.children?.length) return [node];
  return node.children.flatMap(leavesUnder);
}

function filterTree(
  nodes: SectionNode[],
  q: string,
  filter: Filter,
  statuses: StatusMap,
  ancestorMatch = false,
): SectionNode[] {
  const out: SectionNode[] = [];
  for (const node of nodes) {
    const selfMatch =
      !q ||
      node.titleEn.toLowerCase().includes(q) ||
      (node.titleFa ?? "").toLowerCase().includes(q);
    const am = ancestorMatch || selfMatch;
    if (!node.children?.length) {
      const st = statuses.get(node.id) ?? "NOT_STARTED";
      if (am && (filter === "ALL" || st === filter)) out.push(node);
    } else {
      const kids = filterTree(node.children, q, filter, statuses, am);
      if (kids.length) out.push({ ...node, children: kids });
    }
  }
  return out;
}

/* ───────────────────────── Rows ───────────────────────── */

function SectionRow({
  node,
  depth,
  statuses,
  onCycle,
  highlightId,
}: {
  node: SectionNode;
  depth: number;
  statuses: StatusMap;
  onCycle: (id: string, next: ProgressStatus) => void;
  highlightId: string | null;
}) {
  const isLeaf = !node.children?.length;
  const indent = { paddingInlineStart: depth * 20 };

  if (isLeaf) {
    const status = statuses.get(node.id) ?? "NOT_STARTED";
    return (
      <div style={indent}>
        <button
          type="button"
          id={`s-${node.id}`}
          onClick={() => onCycle(node.id, nextStatus(status))}
          aria-label={`${label(node)} — ${STATUS_META[status].label}. برای تغییر وضعیت بزنید`}
          className={cn(
            "flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition hover:bg-surface-overlay/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 active:scale-[.995]",
            highlightId === node.id && "bg-brand-primary/10 ring-2 ring-brand-primary/50",
            status === "DONE" && "opacity-80",
          )}
        >
          <StatusIcon status={status} className="h-7 w-7" />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-sm font-medium",
                status === "DONE" && "text-text-muted line-through decoration-text-muted/40",
              )}
              dir="auto"
            >
              {node.titleFa?.trim() || node.titleEn}
            </span>
            {node.titleFa && (
              <span className="block text-xs text-text-muted" dir="ltr">
                {node.titleEn}
              </span>
            )}
          </span>
          <StatusChip status={status} />
        </button>
      </div>
    );
  }

  const leaves = leavesUnder(node);
  const done = leaves.filter((l) => statuses.get(l.id) === "DONE").length;
  const pct = leaves.length ? (done / leaves.length) * 100 : 0;

  return (
    <div>
      <div style={indent} className="mt-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <p className="min-w-0 flex-1 text-sm font-semibold" dir="auto">
            {label(node)}
          </p>
          <span className="text-xs tabular-nums text-text-muted">
            {fa(done)} از {fa(leaves.length)}
          </span>
          <ProgressBar value={pct} size="sm" className="w-20" />
        </div>
      </div>
      {node.children!.map((c) => (
        <SectionRow
          key={c.id}
          node={c}
          depth={depth + 1}
          statuses={statuses}
          onCycle={onCycle}
          highlightId={highlightId}
        />
      ))}
    </div>
  );
}

/* ───────────────────────── Forms (edit mode) ───────────────────────── */

function AddChapterForm({
  onAdd,
  loading,
}: {
  onAdd: (p: { titleEn: string; titleFa: string; number: string }) => void;
  loading: boolean;
}) {
  const [titleEn, setTitleEn] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [number, setNumber] = useState("");

  return (
    <Card variant="flat" className="space-y-3">
      <p className="text-sm font-semibold">افزودن سرفصل جدید</p>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr_1fr]">
        <input className={inputClass} placeholder="شماره (Ch.1)" dir="ltr" value={number} onChange={(e) => setNumber(e.target.value)} />
        <input className={inputClass} placeholder="عنوان انگلیسی *" dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <input className={inputClass} placeholder="عنوان فارسی" value={titleFa} onChange={(e) => setTitleFa(e.target.value)} />
      </div>
      <Button
        disabled={!titleEn.trim() || loading}
        onClick={() => {
          onAdd({ titleEn: titleEn.trim(), titleFa: titleFa.trim(), number: number.trim() });
          setTitleEn("");
          setTitleFa("");
          setNumber("");
        }}
      >
        <Plus className="h-4 w-4" />
        افزودن سرفصل
      </Button>
    </Card>
  );
}

function AddSectionForm({
  sections,
  onAdd,
  loading,
}: {
  sections: SectionNode[];
  onAdd: (p: { titleEn: string; titleFa: string; parentId?: string }) => void;
  loading: boolean;
}) {
  const [titleEn, setTitleEn] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [parentId, setParentId] = useState("");

  const options = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    const walk = (nodes: SectionNode[], d: number) =>
      nodes.forEach((n) => {
        out.push({ id: n.id, text: `${"— ".repeat(d)}${label(n)}` });
        if (n.children) walk(n.children, d + 1);
      });
    walk(buildSectionTree(sections), 0);
    return out;
  }, [sections]);

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-surface-overlay/50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} placeholder="عنوان مبحث (انگلیسی) *" dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <input className={inputClass} placeholder="عنوان فارسی" value={titleFa} onChange={(e) => setTitleFa(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          className={cn(inputClass, "flex-1")}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          aria-label="زیرمجموعهٔ"
        >
          <option value="">بدون والد (سطح اول)</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.text}
            </option>
          ))}
        </select>
        <Button
          variant="accent"
          disabled={!titleEn.trim() || loading}
          onClick={() => {
            onAdd({
              titleEn: titleEn.trim(),
              titleFa: titleFa.trim(),
              parentId: parentId || undefined,
            });
            setTitleEn("");
            setTitleFa("");
          }}
        >
          <Plus className="h-4 w-4" />
          افزودن مبحث
        </Button>
      </div>
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export function TopicDetailClient({ topicId }: { topicId: string }) {
  const qc = useQueryClient();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const initialised = useRef(false);

  const { data: topic, isLoading, isError } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("not found");
      return (await res.json()) as Topic;
    },
  });

  const progressKey = useMemo(() => ["progress", topicId], [topicId]);
  const { data: progressData } = useQuery({
    queryKey: progressKey,
    queryFn: async () => {
      const res = await fetch(`/api/progress?topicId=${topicId}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as ProgressData;
    },
    enabled: !!topic,
  });

  const mutationKey = useMemo(() => ["set-progress", topicId], [topicId]);
  const inFlight = useIsMutating({ mutationKey });

  const progressMutation = useMutation({
    mutationKey,
    mutationFn: async (v: { sectionId: string; status: ProgressStatus }) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: progressKey });
      qc.setQueryData<ProgressData>(progressKey, (old) => {
        if (!old) return old;
        const rest = old.progress.filter((p) => p.sectionId !== v.sectionId);
        return {
          ...old,
          progress: [...rest, { sectionId: v.sectionId, status: v.status }],
        };
      });
    },
    onSettled: () => {
      // refresh only when it is the last in-flight update (avoids flicker)
      if (qc.isMutating({ mutationKey }) <= 1) {
        qc.invalidateQueries({ queryKey: progressKey });
        qc.invalidateQueries({ queryKey: ["overview"] });
        qc.invalidateQueries({ queryKey: ["topics"] });
      }
    },
  });

  const refreshTopic = () => {
    qc.invalidateQueries({ queryKey: ["topic", topicId] });
    qc.invalidateQueries({ queryKey: ["overview"] });
    qc.invalidateQueries({ queryKey: ["topics"] });
  };

  const addChapter = useMutation({
    mutationFn: async (payload: { titleEn: string; titleFa: string; number: string }) => {
      const res = await fetch(`/api/topics/${topicId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: refreshTopic,
  });

  const addSection = useMutation({
    mutationFn: async (payload: {
      chapterId: string;
      titleEn: string;
      titleFa: string;
      parentId?: string;
    }) => {
      const res = await fetch(`/api/chapters/${payload.chapterId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    onSuccess: refreshTopic,
  });

  const statuses: StatusMap = useMemo(() => {
    const m: StatusMap = new Map();
    progressData?.progress.forEach((p) => m.set(p.sectionId, p.status));
    return m;
  }, [progressData]);

  // Per-chapter derived data
  const chapters = useMemo(() => {
    return (topic?.chapters ?? []).map((ch) => {
      const nodes: SectionNode[] = ch.sections.map((s) => ({
        id: s.id,
        titleEn: s.titleEn,
        titleFa: s.titleFa,
        sortOrder: s.sortOrder,
        parentId: s.parentId,
      }));
      return {
        ch,
        nodes,
        tree: buildSectionTree(nodes),
        leaves: getLeafSections(nodes),
      };
    });
  }, [topic]);

  const totals = useMemo(() => {
    let total = 0;
    let done = 0;
    let progressing = 0;
    chapters.forEach((c) =>
      c.leaves.forEach((l) => {
        total++;
        const s = statuses.get(l.id);
        if (s === "DONE") done++;
        else if (s === "IN_PROGRESS") progressing++;
      }),
    );
    return {
      total,
      done,
      progressing,
      remaining: total - done - progressing,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [chapters, statuses]);

  const next = useMemo(() => {
    for (const c of chapters) {
      const l = c.leaves.find((x) => statuses.get(x.id) === "IN_PROGRESS");
      if (l) return { chapterId: c.ch.id, sectionId: l.id };
    }
    for (const c of chapters) {
      const l = c.leaves.find((x) => (statuses.get(x.id) ?? "NOT_STARTED") === "NOT_STARTED");
      if (l) return { chapterId: c.ch.id, sectionId: l.id };
    }
    return null;
  }, [chapters, statuses]);

  const scrollToSection = (sectionId: string) => {
    setHighlightId(sectionId);
    setTimeout(() => {
      document
        .getElementById(`s-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    setTimeout(() => setHighlightId(null), 2800);
  };

  // Initial open chapter + deep link
  useEffect(() => {
    if (initialised.current || !topic || !progressData) return;
    initialised.current = true;
    const chapterParam = params.get("chapter");
    const sectionParam = params.get("section");
    const target =
      chapterParam && topic.chapters.some((c) => c.id === chapterParam)
        ? chapterParam
        : next?.chapterId ?? topic.chapters[0]?.id;
    if (target) setOpen(new Set([target]));
    if (sectionParam) scrollToSection(sectionParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, progressData]);

  const onCycle = (sectionId: string, status: ProgressStatus) =>
    progressMutation.mutate({ sectionId, status });

  const toggle = (id: string) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44" />
        <Skeleton className="h-16" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (isError || !topic) {
    return (
      <EmptyState
        icon={<CircleAlert className="h-6 w-6" />}
        title="موضوع پیدا نشد"
        description="شاید حذف شده یا شما به آن دسترسی ندارید."
        action={
          <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
            بازگشت به داشبورد
          </Link>
        }
      />
    );
  }

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || filter !== "ALL";
  const isTeam = topic.scope === "TEAM";
  const members = progressData?.membersSummary ?? [];
  const backHref = isTeam ? "/dashboard/team" : "/dashboard/personal";

  // Chapters (after filter) grouped by part
  const visible = chapters
    .map((c) => ({
      ...c,
      shown: filtering ? filterTree(c.tree, q, filter, statuses) : c.tree,
    }))
    .filter((c) => !filtering || c.shown.length > 0);

  const groups: { part: string | null; items: typeof visible }[] = [];
  for (const c of visible) {
    const part = c.ch.partLabel ? cleanPart(c.ch.partLabel) : null;
    const last = groups[groups.length - 1];
    if (last && last.part === part) last.items.push(c);
    else groups.push({ part, items: [c] });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowRight className="h-4 w-4" />
          {isTeam ? "یادگیری تیمی" : "یادگیری شخصی"}
        </Link>
        <Card variant="focal">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <ProgressRing value={totals.percent} tone="inverse" size={120} stroke={10}>
              <span className="text-2xl font-bold tabular-nums">{fa(totals.percent)}٪</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <Badge className="bg-white/20 text-white">
                {isTeam ? "تیمی" : "شخصی"}
              </Badge>
              <h1 className="mt-2 text-2xl font-bold leading-snug" dir="auto">
                {topic.titleFa?.trim() || topic.titleEn}
              </h1>
              {topic.titleFa && (
                <p className="text-sm text-white/80" dir="ltr">
                  {topic.titleEn}
                </p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: totals.done, l: "تمام‌شده" },
                  { v: totals.progressing, l: "در حال یادگیری" },
                  { v: totals.remaining, l: "باقی‌مانده" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-white/15 px-2 py-3">
                    <p className="text-xl font-bold tabular-nums">{fa(s.v)}</p>
                    <p className="text-xs text-white/80">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
            {next && (
              <button
                type="button"
                onClick={() => {
                  setFilter("ALL");
                  setQuery("");
                  setOpen((p) => new Set(p).add(next.chapterId));
                  scrollToSection(next.sectionId);
                }}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-pill bg-white px-6 font-semibold text-brand-deep transition hover:bg-white/90 active:scale-[.98]"
              >
                <Play className="h-5 w-5" />
                ادامه
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Team progress */}
      {isTeam && members.length > 0 && (
        <Card>
          <CardTitle icon={<Users className="h-5 w-5 text-brand-primary" />}>
            پیشرفت اعضای تیم
          </CardTitle>
          <MemberBars
            members={members.map((m) => ({
              id: m.userId,
              name: m.name,
              percent: m.percent,
              isMe: m.userId === session?.user?.id,
            }))}
          />
        </Card>
      )}

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو در سرفصل‌ها و مباحث…"
              className={cn(inputClass, "bg-surface-raised ps-11 pe-11 ring-border/60")}
            />
            {query && (
              <button
                type="button"
                aria-label="پاک کردن جستجو"
                onClick={() => setQuery("")}
                className="absolute end-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-text-muted hover:bg-surface-overlay"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={editing ? "primary" : "secondary"}
            onClick={() => setEditing((e) => !e)}
          >
            <Pencil className="h-4 w-4" />
            {editing ? "پایان ویرایش" : "ویرایش سرفصل‌ها"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="فیلتر وضعیت">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-10 rounded-pill px-4 text-sm font-medium transition",
                filter === f.id
                  ? "bg-brand-primary text-white shadow-glow"
                  : "bg-surface-raised text-text-muted ring-1 ring-border/60 hover:text-text",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ms-auto hidden items-center gap-4 text-xs text-text-muted md:flex">
            {(["NOT_STARTED", "IN_PROGRESS", "DONE"] as ProgressStatus[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <StatusIcon status={s} className="h-4 w-4" />
                {STATUS_META[s].label}
              </span>
            ))}
          </span>
        </div>
        <p className="text-xs text-text-muted">
          روی هر مبحث بزنید تا وضعیتش عوض شود: شروع نشده ← در حال یادگیری ← تمام شد.
        </p>
      </div>

      {editing && (
        <AddChapterForm
          onAdd={(p) => addChapter.mutate(p)}
          loading={addChapter.isPending}
        />
      )}

      {/* Chapters */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title={filtering ? "نتیجه‌ای پیدا نشد" : "هنوز سرفصلی ندارد"}
          description={
            filtering
              ? "جستجو یا فیلتر را تغییر دهید."
              : "با دکمهٔ «ویرایش سرفصل‌ها» سرفصل اضافه کنید."
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g, gi) => (
            <section key={gi} className="space-y-3">
              {g.part && (
                <h2 className="px-1 text-sm font-semibold text-text-muted">{g.part}</h2>
              )}
              {g.items.map(({ ch, nodes, leaves, shown }) => {
                const done = leaves.filter((l) => statuses.get(l.id) === "DONE").length;
                const prog = leaves.filter((l) => statuses.get(l.id) === "IN_PROGRESS").length;
                const pct = leaves.length ? (done / leaves.length) * 100 : 0;
                const isOpen = filtering || open.has(ch.id);
                const complete = leaves.length > 0 && done === leaves.length;

                return (
                  <Card key={ch.id} as="article" className="p-0 md:p-0">
                    <button
                      type="button"
                      onClick={() => toggle(ch.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-4 rounded-card p-4 text-start transition hover:bg-surface-overlay/40 md:p-5"
                    >
                      <span
                        className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold",
                          complete
                            ? "bg-state-done/15 text-state-done"
                            : "bg-brand-primary/10 text-brand-primary",
                        )}
                        dir="ltr"
                      >
                        {ch.number?.replace(/^Ch\.?\s*/i, "") || "•"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold" dir="auto">
                          {label(ch)}
                        </span>
                        {ch.titleFa && (
                          <span className="block truncate text-xs text-text-muted" dir="ltr">
                            {ch.titleEn}
                          </span>
                        )}
                        <span className="mt-2 flex items-center gap-3">
                          <ProgressBar value={pct} size="sm" className="flex-1" />
                          <span className="shrink-0 text-xs tabular-nums text-text-muted">
                            {fa(done)} از {fa(leaves.length)}
                            {prog > 0 && ` · ${fa(prog)} در حال یادگیری`}
                          </span>
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 shrink-0 text-text-muted transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/60 p-2 pb-3 md:p-3">
                        {shown.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-text-muted">
                            این سرفصل هنوز مبحثی ندارد.
                          </p>
                        ) : (
                          shown.map((node) => (
                            <SectionRow
                              key={node.id}
                              node={node}
                              depth={0}
                              statuses={statuses}
                              onCycle={onCycle}
                              highlightId={highlightId}
                            />
                          ))
                        )}
                        {editing && (
                          <AddSectionForm
                            sections={nodes}
                            loading={addSection.isPending}
                            onAdd={(p) => addSection.mutate({ chapterId: ch.id, ...p })}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </section>
          ))}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {inFlight > 0 ? "در حال ذخیره" : ""}
      </span>
    </div>
  );
}
