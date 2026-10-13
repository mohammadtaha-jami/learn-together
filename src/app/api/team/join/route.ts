import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const existing = await prisma.teamMember.findFirst({
    where: { userId: auth.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "قبلاً عضو یک تیم هستید" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const inviteCode = body.inviteCode?.toString().trim().toUpperCase();
  if (!inviteCode) {
    return NextResponse.json({ error: "کد دعوت الزامی است" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { inviteCode } });
  if (!team) {
    return NextResponse.json({ error: "کد دعوت نامعتبر است" }, { status: 404 });
  }

  await prisma.teamMember.create({
    data: {
      userId: auth.user.id,
      teamId: team.id,
      role: "MEMBER",
    },
  });

  return NextResponse.json({ team });
}
