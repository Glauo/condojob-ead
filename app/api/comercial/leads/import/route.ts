import { NextRequest, NextResponse } from "next/server";
import { initSchema } from "@/lib/db";
import { requireCommercialSession } from "@/lib/commercial";
import { importParsedLeads, parseLeadFile } from "@/lib/lead-import";

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo obrigatorio." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
  }

  try {
    const parsed = await parseLeadFile(file);
    if (!parsed.length) {
      return NextResponse.json({ error: "Nenhum lead valido foi encontrado no arquivo." }, { status: 400 });
    }

    const result = await importParsedLeads(parsed, session.id, file.name);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao importar leads.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
