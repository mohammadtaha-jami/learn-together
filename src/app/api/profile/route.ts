import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const select = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  createdAt: true,
} as const;

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select,
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const name = body.name?.toString().trim();
  const avatarRaw = body.avatarUrl?.toString().trim();

  if (name !== undefined && (name.length < 2 || name.length > 60)) {
    return NextResponse.json({ error: "نام باید بین ۲ تا ۶۰ کاراکتر باشد" }, { status: 400 });
  }

  let avatarUrl: string | null | undefined;
  if (avatarRaw !== undefined) {
    if (avatarRaw === "") {
      avatarUrl = null;
    } else {
      try {
        const u = new URL(avatarRaw);
        if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
        avatarUrl = u.toString();
      } catch {
        return NextResponse.json({ error: "آدرس تصویر معتبر نیست" }, { status: 400 });
      }
    }
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: { name: name || undefined, avatarUrl },
    select,
  });
  return NextResponse.json(user);
}
