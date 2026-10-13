import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const current = body.currentPassword?.toString() ?? "";
  const next = body.newPassword?.toString() ?? "";

  if (next.length < 6) {
    return NextResponse.json({ error: "رمز جدید حداقل ۶ کاراکتر باشد" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    return NextResponse.json({ error: "رمز فعلی درست نیست" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 12) },
  });
  return NextResponse.json({ ok: true });
}
