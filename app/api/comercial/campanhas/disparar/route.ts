import { NextRequest, NextResponse } from "next/server";
import { initSchema } from "@/lib/db";
import { requireCommercialSession } from "@/lib/commercial";
import { processCampaignDispatch } from "@/lib/commercial-campaigns";

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Campanha obrigatoria." }, { status: 400 });

  const result = await processCampaignDispatch(id, session.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
