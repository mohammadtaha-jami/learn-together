"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CircleAlert, KeyRound, Plus, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Field } from "@/components/ui/Field";

type TeamData = {
  team: { id: string; name: string; inviteCode: string } | null;
};

export function TeamSetupPanel() {
  const qc = useQueryClient();
  const [inviteInput, setInviteInput] = useState("");
  const [teamName, setTeamName] = useState("تیم یادگیری");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as TeamData;
    },
  });

  const refresh = () => {
    setError("");
    qc.invalidateQueries({ queryKey: ["team"] });
    qc.invalidateQueries({ queryKey: ["topics"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  };

  const request = async (url: string, body: object) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "خطایی رخ داد");
    return json;
  };

  const createTeam = useMutation({
    mutationFn: () => request("/api/team", { name: teamName }),
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });
  const joinTeam = useMutation({
    mutationFn: () => request("/api/team/join", { inviteCode: inviteInput }),
    onSuccess: refresh,
    onError: (e: Error) => setError(e.message),
  });

  if (isLoading) return null;

  if (data?.team) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm text-text-muted">تیم شما</p>
            <p className="text-lg font-semibold">{data.team.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-end">
            <p className="text-xs text-text-muted">کد دعوت</p>
            <p className="font-mono text-lg font-bold tracking-widest text-brand-primary" dir="ltr">
              {data.team.inviteCode}
            </p>
          </div>
          <CopyButton text={data.team.inviteCode} label="کپی کد" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
            <Plus className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold">ساخت تیم جدید</h3>
            <p className="text-sm text-text-muted">بعد از ساخت، کد دعوت را برای هم‌تیمی‌ها بفرستید.</p>
          </div>
          <Field
            label="نام تیم"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            icon={<Users className="h-5 w-5" />}
          />
          <Button
            className="w-full"
            disabled={createTeam.isPending || !teamName.trim()}
            onClick={() => createTeam.mutate()}
          >
            ساخت تیم
          </Button>
        </Card>

        <Card className="space-y-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-accent/15 text-brand-accent">
            <UserPlus className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold">پیوستن با کد دعوت</h3>
            <p className="text-sm text-text-muted">کدی که هم‌تیمی‌تان داده را وارد کنید.</p>
          </div>
          <Field
            label="کد دعوت"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
            placeholder="FSA26"
            dir="ltr"
            className="font-mono tracking-widest"
            icon={<KeyRound className="h-5 w-5" />}
          />
          <Button
            variant="accent"
            className="w-full"
            disabled={joinTeam.isPending || !inviteInput.trim()}
            onClick={() => joinTeam.mutate()}
          >
            پیوستن به تیم
          </Button>
        </Card>
      </div>
    </div>
  );
}
