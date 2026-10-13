"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, Plus, User, Users } from "lucide-react";
import type { TopicScope } from "@prisma/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, inputClass } from "@/components/ui/Field";
import { cn } from "@/lib/utils/cn";

const SCOPES = [
  { id: "TEAM" as const, icon: Users, title: "تیمی", text: "همهٔ اعضای تیم می‌بینند" },
  { id: "PERSONAL" as const, icon: User, title: "شخصی", text: "فقط خودتان می‌بینید" },
];

function NewTopicForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const initial = searchParams.get("scope") === "TEAM" ? "TEAM" : "PERSONAL";

  const [scope, setScope] = useState<TopicScope>(initial);
  const [titleEn, setTitleEn] = useState("");
  const [titleFa, setTitleFa] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const { data: teamData } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      return (await res.json()) as {
        team: { id: string; name: string; inviteCode: string } | null;
      };
    },
  });
  const noTeam = scope === "TEAM" && !teamData?.team;

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          titleEn,
          titleFa,
          description,
          teamId: scope === "TEAM" ? teamData?.team?.id : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json as { id: string };
    },
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      router.push(`/dashboard/topics/${t.id}`);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="موضوع جدید" subtitle="کتاب یا موضوع تازه‌ای برای یادگیری بسازید." />
      <Card className="space-y-6">
        {error && (
          <p className="flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">نوع موضوع</p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={scope === s.id}
                onClick={() => setScope(s.id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl p-4 text-start ring-1 transition",
                  scope === s.id
                    ? "bg-brand-primary/10 ring-2 ring-brand-primary"
                    : "bg-surface-overlay/50 ring-border/60 hover:bg-surface-overlay",
                )}
              >
                <s.icon className={cn("h-6 w-6", scope === s.id ? "text-brand-primary" : "text-text-muted")} />
                <span className="font-semibold">{s.title}</span>
                <span className="text-xs text-text-muted">{s.text}</span>
              </button>
            ))}
          </div>
          {noTeam && (
            <p className="mt-3 text-sm text-state-progress">
              ابتدا باید{" "}
              <Link href="/dashboard/team" className="font-medium underline">
                یک تیم بسازید یا به تیمی بپیوندید
              </Link>
              .
            </p>
          )}
        </div>

        <Field label="عنوان انگلیسی *" dir="ltr" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Fundamentals of Software Architecture" />
        <Field label="عنوان فارسی" value={titleFa} onChange={(e) => setTitleFa(e.target.value)} />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">توضیح (اختیاری)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(inputClass, "h-auto py-3")}
          />
        </label>

        <Button
          size="lg"
          className="w-full"
          disabled={!titleEn.trim() || noTeam || create.isPending}
          onClick={() => create.mutate()}
        >
          <Plus className="h-5 w-5" />
          ساخت موضوع
        </Button>
      </Card>
    </div>
  );
}

export default function NewTopicPage() {
  return (
    <Suspense fallback={null}>
      <NewTopicForm />
    </Suspense>
  );
}
