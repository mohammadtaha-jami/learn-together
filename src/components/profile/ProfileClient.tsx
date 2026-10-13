"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import {
  Check,
  CircleAlert,
  ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  User,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyTeams } from "@/components/profile/MyTeams";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { ClientDateTime } from "@/components/ui/ClientDateTime";
import { Field } from "@/components/ui/Field";
import { Avatar } from "@/components/ui/MemberBars";
import { Skeleton } from "@/components/ui/Skeleton";

type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
};

function Notice({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger"
          : "flex items-start gap-2 rounded-2xl bg-state-done/10 p-3 text-sm text-state-done"
      }
    >
      {tone === "error" ? (
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {children}
    </p>
  );
}

export function ProfileClient() {
  const qc = useQueryClient();
  const { update } = useSession();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as Profile;
    },
  });

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [infoMsg, setInfoMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatarUrl(profile.avatarUrl ?? "");
    }
  }, [profile]);

  const saveInfo = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ذخیره نشد");
      return json as Profile;
    },
    onSuccess: async (p) => {
      qc.setQueryData(["profile"], p);
      qc.invalidateQueries({ queryKey: ["team-members"] });
      await update({ name: p.name });
      setInfoMsg({ tone: "ok", text: "اطلاعات ذخیره شد." });
    },
    onError: (e: Error) => setInfoMsg({ tone: "error", text: e.message }),
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ tone: "error" | "ok"; text: string } | null>(null);

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "تغییر رمز انجام نشد");
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setPassMsg({ tone: "ok", text: "رمز عبور عوض شد." });
    },
    onError: (e: Error) => setPassMsg({ tone: "error", text: e.message }),
  });

  const dirty = !!profile && (name !== profile.name || avatarUrl !== (profile.avatarUrl ?? ""));

  return (
    <div className="space-y-6">
      <PageHeader
        title="پروفایل من"
        subtitle="اطلاعات حساب و تیم‌هایی که عضوشان هستید."
        action={
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
            خروج از حساب
          </Button>
        }
      />

      {isLoading || !profile ? (
        <Skeleton className="h-40" />
      ) : (
        <Card variant="focal" className="flex flex-wrap items-center gap-5">
          <Avatar
            name={profile.name}
            src={profile.avatarUrl}
            className="h-20 w-20 bg-white/20 text-2xl text-white ring-4 ring-white/20"
          />
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold">{profile.name}</h2>
            <p className="truncate text-sm text-white/80" dir="ltr">
              {profile.email}
            </p>
            <p className="mt-1 text-xs text-white/70">
              عضو از <ClientDateTime iso={profile.createdAt} />
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={<UserRound className="h-5 w-5 text-brand-primary" />}>
            اطلاعات حساب
          </CardTitle>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setInfoMsg(null);
              saveInfo.mutate();
            }}
          >
            {infoMsg && <Notice tone={infoMsg.tone}>{infoMsg.text}</Notice>}
            <Field
              label="نام نمایشی"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="h-5 w-5" />}
              required
            />
            <Field
              label="ایمیل"
              value={profile?.email ?? ""}
              disabled
              dir="ltr"
              icon={<Mail className="h-5 w-5" />}
              className="opacity-70"
            />
            <Field
              label="آدرس تصویر پروفایل (اختیاری)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              dir="ltr"
              icon={<ImageIcon className="h-5 w-5" />}
            />
            <Button type="submit" disabled={!dirty || saveInfo.isPending}>
              {saveInfo.isPending ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle icon={<Lock className="h-5 w-5 text-brand-primary" />}>تغییر رمز عبور</CardTitle>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setPassMsg(null);
              changePassword.mutate();
            }}
          >
            {passMsg && <Notice tone={passMsg.tone}>{passMsg.text}</Notice>}
            <Field
              label="رمز فعلی"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              dir="ltr"
              icon={<KeyRound className="h-5 w-5" />}
              required
            />
            <Field
              label="رمز جدید (حداقل ۶ کاراکتر)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              dir="ltr"
              icon={<KeyRound className="h-5 w-5" />}
              required
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!currentPassword || newPassword.length < 6 || changePassword.isPending}
            >
              {changePassword.isPending ? "در حال تغییر…" : "تغییر رمز"}
            </Button>
          </form>
        </Card>
      </div>

      <MyTeams />
    </div>
  );
}
