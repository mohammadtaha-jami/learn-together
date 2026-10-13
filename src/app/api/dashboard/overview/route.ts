import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { buildOverview } from "@/lib/learning/overview";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const tz = Number(new URL(request.url).searchParams.get("tz") ?? 0);
  const overview = await buildOverview(
    auth.user.id,
    Number.isFinite(tz) ? tz : 0,
  );
  return NextResponse.json(overview);
}
