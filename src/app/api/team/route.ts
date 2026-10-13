import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { generateInviteCode } from "@/lib/team/helpers";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const membership = await prisma.teamMember.findFirst({
    where: { userId: auth.user.id },
    include: { team: true },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ team: membership?.team ?? null, role: membership?.role ?? null });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const existing = await prisma.teamMember.findFirst({
    where: { userId: auth.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "در حال حاضر فقط یک تیم پشتیبانی می‌شود" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const name = body.name?.toString().trim() || "تیم یادگیری";

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.team.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const team = await prisma.team.create({
    data: {
      name,
      inviteCode,
      members: {
        create: {
          userId: auth.user.id,
          role: "OWNER",
        },
      },
    },
  });

  return NextResponse.json(team, { status: 201 });
}
