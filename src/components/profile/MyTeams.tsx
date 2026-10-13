"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  useActiveTeam,
  type TeamListItem,
} from "@/components/team/ActiveTeamProvider";
import { TeamDialog } from "@/components/team/TeamDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/MemberBars";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { fa } from "@/lib/learning/status";
import { cn } from "@/lib/utils/cn";

type Member = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "OWNER" | "MEMBER";
};

function TeamMembers({ teamId }: { teamId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/team/members?teamId=${teamId}`);
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as { members: Member[] };
    },
  });

  if (isLoading || !data) return <Skeleton className="h-20" />;
  return (
    <ul className="space-y-2">
      {data.members.map((m) => (
        <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-surface-overlay/50 px-3 py-2">
          <Avatar name={m.name} src={m.avatarUrl} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{m.name}</p>
            <p className="truncate text-xs text-text-muted" dir="ltr">
              {m.email}
            </p>
          </div>
          <Badge variant={m.role === "OWNER" ? "team" : "neutral"}>
            {m.role === "OWNER" ? "مدیر" : "عضو"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function TeamRow({
  team,
  isActive,
  onLeave,
  onMakeActive,
}: {
  team: TeamListItem;
  isActive: boolean;
  onLeave: () => void;
  onMakeActive: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-2xl ring-1 ring-border/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3 text-start transition hover:bg-surface-overlay/40 md:p-4"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <Users className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold">{team.name}</span>
            <Badge variant={team.role === "OWNER" ? "team" : "neutral"}>
              {team.role === "OWNER" ? "مدیر" : "عضو"}
            </Badge>
            {isActive && <Badge variant="done">نمایش در داشبورد</Badge>}
          </span>
          <span className="mt-0.5 block text-xs text-text-muted">
            {fa(team.memberCount)} عضو · {fa(team.topicCount)} موضوع
          </span>
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-primary/5 p-3 ring-1 ring-brand-primary/15">
            <div>
              <p className="text-xs text-text-muted">کد دعوت — برای افزودن عضو بفرستید</p>
              <p className="font-mono text-lg font-bold tracking-widest text-brand-primary" dir="ltr">
                {team.inviteCode}
              </p>
            </div>
            <CopyButton text={team.inviteCode} label="کپی کد" />
          </div>

          <TeamMembers teamId={team.id} />

          <div className="flex flex-wrap gap-2">
            {!isActive && (
              <Button variant="secondary" size="sm" onClick={onMakeActive}>
                <LayoutDashboard className="h-4 w-4" />
                نمایش در داشبورد
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={onLeave}>
              <LogOut className="h-4 w-4" />
              خروج از تیم
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export function MyTeams() {
  const qc = useQueryClient();
  const { teams, activeTeamId, isLoading, setActiveTeamId } = useActiveTeam();
  const [dialog, setDialog] = useState<"create" | "join" | null>(null);
  const [leaving, setLeaving] = useState<TeamListItem | null>(null);
  const [error, setError] = useState("");

  const leave = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch("/api/team/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خروج انجام نشد");
    },
    onSuccess: () => {
      setLeaving(null);
      setError("");
      qc.invalidateQueries({ queryKey: ["team"] });
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card id="teams" className="scroll-mt-6">
      <CardTitle
        icon={<Users className="h-5 w-5 text-brand-primary" />}
        action={
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDialog("join")}>
              <UserPlus className="h-4 w-4" />
              پیوستن
            </Button>
            <Button variant="accent" size="sm" onClick={() => setDialog("create")}>
              <Plus className="h-4 w-4" />
              تیم جدید
            </Button>
          </div>
        }
      >
        تیم‌های من
      </CardTitle>

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-32" />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="عضو هیچ تیمی نیستید"
          description="یک تیم بسازید یا با کد دعوت بپیوندید."
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {teams.map((t) => (
            <TeamRow
              key={t.id}
              team={t}
              isActive={t.id === activeTeamId}
              onLeave={() => setLeaving(t)}
              onMakeActive={() => setActiveTeamId(t.id).catch((e) => setError(e.message))}
            />
          ))}
        </ul>
      )}

      {dialog && <TeamDialog open onClose={() => setDialog(null)} initialTab={dialog} />}

      <Modal
        open={!!leaving}
        onClose={() => setLeaving(null)}
        title="خروج از تیم"
        icon={<LogOut className="h-5 w-5" />}
      >
        <p className="text-sm leading-7 text-text-muted">
          از تیم <strong className="text-text">«{leaving?.name}»</strong> خارج می‌شوید. موضوعات این تیم
          دیگر برای شما نمایش داده نمی‌شود، ولی برای بقیهٔ اعضا باقی می‌ماند.
          {leaving?.memberCount === 1 && " چون تنها عضو هستید، تیم و موضوعاتش حذف می‌شوند."}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLeaving(null)}>
            انصراف
          </Button>
          <Button
            variant="danger"
            disabled={leave.isPending}
            onClick={() => leaving && leave.mutate(leaving.id)}
          >
            <LogOut className="h-4 w-4" />
            {leave.isPending ? "در حال خروج…" : "خروج"}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
