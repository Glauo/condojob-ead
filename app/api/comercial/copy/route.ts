import { NextRequest, NextResponse } from "next/server";
import { initSchema } from "@/lib/db";
import { optimizeCommercialCopyWithAI, requireCommercialSession } from "@/lib/commercial";

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const result = await optimizeCommercialCopyWithAI({
    canal: body.canal,
    objetivo: body.objetivo,
    tom: body.tom,
    empresa: body.empresa,
    nomeContato: body.nomeContato,
    contexto: body.contexto,
    assunto: body.assunto,
  });

  return NextResponse.json(result);
}
