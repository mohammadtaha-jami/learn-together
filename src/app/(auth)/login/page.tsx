"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { CircleAlert, KeyRound, LogIn, Mail } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("ایمیل یا رمز عبور درست نیست. دوباره تلاش کنید.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="ورود به حساب"
      subtitle="ایمیل و رمز عبور خود را وارد کنید."
      icon={<LogIn className="h-6 w-6" />}
      footer={
        <>
          حساب ندارید؟{" "}
          <Link href="/register" className="font-medium text-brand-primary">
            ثبت‌نام کنید
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <p className="flex items-start gap-2 rounded-2xl bg-state-danger/10 p-3 text-sm text-state-danger">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
        <Field
          label="ایمیل"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          icon={<Mail className="h-5 w-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />
        <Field
          label="رمز عبور"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          icon={<KeyRound className="h-5 w-5" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "در حال ورود…" : "ورود"}
        </Button>
      </form>
    </AuthCard>
  );
}
