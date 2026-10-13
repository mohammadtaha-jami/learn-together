"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { CircleAlert, KeyRound, Mail, User, UserPlus } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const reg = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await reg.json();
    if (!reg.ok) {
      setLoading(false);
      setError(data.error || "ثبت‌نام انجام نشد. دوباره تلاش کنید.");
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      router.push("/login");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="ساخت حساب جدید"
      subtitle="در چند ثانیه شروع کنید."
      icon={<UserPlus className="h-6 w-6" />}
      footer={
        <>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="font-medium text-brand-primary">
            وارد شوید
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
          label="نام"
          name="name"
          required
          autoComplete="name"
          icon={<User className="h-5 w-5" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          label="رمز عبور (حداقل ۶ کاراکتر)"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
          icon={<KeyRound className="h-5 w-5" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "در حال ساخت حساب…" : "ثبت‌نام"}
        </Button>
      </form>
    </AuthCard>
  );
}
