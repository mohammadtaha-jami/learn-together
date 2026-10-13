import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: { id: user.id, email: user.email ?? "", name: user.name ?? "" } };
}
