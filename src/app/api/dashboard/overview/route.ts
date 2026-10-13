import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { buildOverview } from "@/lib/learning/overview";
import { resolveActiveTeamId } from "@/lib/team/active-team";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const tz = Number(searchParams.get("tz") ?? 0);
  const teamParam = searchParams.get("teamId");
  const activeTeamId =
    teamParam || (await resolveActiveTeamId(auth.user.id));

  const overview = await buildOverview(
    auth.user.id,
    Number.isFinite(tz) ? tz : 0,
    activeTeamId,
  );
  return NextResponse.json(overview);
}
