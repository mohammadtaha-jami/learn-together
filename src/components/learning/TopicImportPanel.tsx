"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, FileJson, Upload } from "lucide-react";
import type { TopicScope } from "@prisma/client";
import { ImportGuide } from "@/components/learning/ImportGuide";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import {
  ImportValidationError,
  parseTopicImport,
  type ParsedTopicImport,
} from "@/lib/learning/topic-import";
import { fa } from "@/lib/learning/status";
import { cn } from "@/lib/utils/cn";

export function TopicImportPanel({
  scope,
  teamId,
  disabled,
}: {
  scope: TopicScope;
  teamId: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawData, setRawData] = useState<unknown>(null);
  const [titleEn, setTitleEn] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [description, setDescription] = useState("");
  const [parseError, setParseError] = useState("");
  const [preview, setPreview] = useState<ParsedTopicImport | null>(null);

  const reparse = useCallback(() => {
    if (!rawData) {
      setPreview(null);
      setParseError("");
      return;
    }
    try {
      const parsed = parseTopicImport(rawData, {
        titleEn: titleEn.trim() || undefined,
        titleFa: titleFa.trim() || undefined,
        description: description.trim() || undefined,
      });
      setPreview(parsed);
      setParseError("");
      if (!titleEn.trim() && parsed.meta.titleEn) {
        setTitleEn(parsed.meta.titleEn);
      }
      if (!titleFa.trim() && parsed.meta.titleFa) {
        setTitleFa(parsed.meta.titleFa);
      }
    } catch (e) {
      setPreview(null);
      setParseError(
        e instanceof ImportValidationError ? e.message : "فایل JSON قابل خواندن نیست.",
      );
    }
  }, [rawData, titleEn, titleFa, description]);

  const onFile = async (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setParseError("فقط فایل .json مجاز است.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError("حداکثر حجم فایل ۵ مگابایت است.");
      return;
    }
    setFileName(file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as unknown;
      setRawData(data);
      setParseError("");
    } catch {
      setRawData(null);
      setPreview(null);
      setParseError("JSON نامعتبر است. ساختار را با راهنما مقایسه کنید.");
    }
  };

  useEffect(() => {
    if (rawData) reparse();
    else {
      setPreview(null);
      setParseError("");
    }
  }, [rawData, titleEn, titleFa, description, reparse]);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!rawData) throw new Error("فایلی انتخاب نشده است.");
      const res = await fetch("/api/topics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          teamId: scope === "TEAM" ? teamId : null,
          titleEn: titleEn.trim() || undefined,
          titleFa: titleFa.trim() || undefined,
          description: description.trim() || undefined,
          data: rawData,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "بارگذاری انجام نشد");
      return json as { topic: { id: string }; stats: ParsedTopicImport["stats"] };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      router.push(`/dashboard/topics/${data.topic.id}`);
    },
  });

  return (
    <div className="space-y-4">
      <ImportGuide />

      <Card className="space-y-4">
        <label
          className={cn(
            "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-overlay/70 px-4 py-8 transition",
            !disabled && "hover:border-brand-primary/50 hover:bg-brand-primary/5",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              void onFile(e.target.files?.[0] ?? null);
            }}
          />
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Upload className="h-7 w-7" />
          </span>
          <span className="text-center">
            <span className="block font-semibold">انتخاب یا رها کردن فایل JSON</span>
            <span className="mt-1 block text-sm text-text-muted">
              {fileName ? fileName : "حداکثر ۵ مگابایت"}
            </span>
          </span>
        </label>

        {(parseError || importMutation.error) && (
          <p className="flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {parseError || (importMutation.error as Error).message}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="عنوان انگلیسی موضوع *"
            dir="ltr"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="در فایل یا اینجا"
            icon={<FileJson className="h-5 w-5" />}
          />
          <Field
            label="عنوان فارسی"
            value={titleFa}
            onChange={(e) => setTitleFa(e.target.value)}
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">توضیح (اختیاری)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={cn(inputClass, "h-auto py-3")}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!rawData}
            onClick={reparse}
          >
            بررسی فایل
          </Button>
        </div>

        {preview && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-state-done/10 px-4 py-3 text-sm">
            <CircleCheck className="h-5 w-5 text-state-done" />
            <span>
              <strong className="text-text">{preview.meta.titleEn}</strong>
              <span className="text-text-muted">
                {" "}
                — {fa(preview.stats.parts)} بخش، {fa(preview.stats.chapters)} سرفصل،{" "}
                {fa(preview.stats.leaves)} مبحث قابل‌پیگیری
              </span>
            </span>
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          disabled={disabled || !preview || importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          <Upload className="h-5 w-5" />
          {importMutation.isPending ? "در حال ساخت موضوع…" : "بارگذاری و ساخت موضوع"}
        </Button>
      </Card>
    </div>
  );
}
