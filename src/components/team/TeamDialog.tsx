"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, KeyRound, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

type Tab = "create" | "join";

async function post(url: string, body: object) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "خطایی رخ داد");
  return json;
}

export function TeamDialog({
  open,
  onClose,
  initialTab = "create",
}: {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const done = () => {
    setError("");
    setTeamName("");
    setInviteCode("");
    qc.invalidateQueries({ queryKey: ["team"] });
    qc.invalidateQueries({ queryKey: ["team-members"] });
    qc.invalidateQueries({ queryKey: ["topics"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
    onClose();
  };

  const create = useMutation({
    mutationFn: () => post("/api/team", { name: teamName.trim() }),
    onSuccess: done,
    onError: (e: Error) => setError(e.message),
  });
  const join = useMutation({
    mutationFn: () => post("/api/team/join", { inviteCode: inviteCode.trim() }),
    onSuccess: done,
    onError: (e: Error) => setError(e.message),
  });

  const tabs: { id: Tab; label: string; icon: typeof Plus }[] = [
    { id: "create", label: "ساخت تیم", icon: Plus },
    { id: "join", label: "پیوستن با کد", icon: UserPlus },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تیم جدید"
      description="هر تیم موضوعات و اعضای جداگانه دارد."
      icon={<Users className="h-5 w-5" />}
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-pill bg-surface-overlay p-1" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setError("");
            }}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-pill text-sm font-medium transition",
              tab === t.id
                ? "bg-surface-raised text-text shadow-soft"
                : "text-text-muted hover:text-text",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {tab === "create" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field
            label="نام تیم"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="مثلاً: تیم معماری نرم‌افزار"
            icon={<Users className="h-5 w-5" />}
            autoFocus
          />
          <p className="text-xs text-text-muted">
            بعد از ساخت، کد دعوت را از «پروفایل ← تیم‌های من» برای هم‌تیمی‌ها بفرستید.
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={!teamName.trim() || create.isPending}>
            {create.isPending ? "در حال ساخت…" : "ساخت تیم"}
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            join.mutate();
          }}
        >
          <Field
            label="کد دعوت"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="FSA26"
            dir="ltr"
            className="font-mono tracking-widest"
            icon={<KeyRound className="h-5 w-5" />}
            autoFocus
          />
          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={!inviteCode.trim() || join.isPending}
          >
            {join.isPending ? "در حال پیوستن…" : "پیوستن به تیم"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
