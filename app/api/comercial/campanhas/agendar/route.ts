import { NextRequest, NextResponse } from "next/server";
import { initSchema } from "@/lib/db";
import { requireCommercialSession } from "@/lib/commercial";
import { setCampaignAutoMode } from "@/lib/commercial-campaigns";

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "Campanha obrigatoria." }, { status: 400 });

  const updated = await setCampaignAutoMode(String(body.id), Boolean(body.enabled));
  if (!updated) {
    return NextResponse.json({ error: "Campanha nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, campanha: updated });
}
