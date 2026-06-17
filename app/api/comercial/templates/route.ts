import { NextRequest, NextResponse } from "next/server";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";
import {
  normalizeChannel,
  normalizeObjective,
  normalizeTone,
  requireCommercialSession,
} from "@/lib/commercial";

export async function GET() {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const templates = await dbQuery("SELECT * FROM cj_comercial_templates ORDER BY atualizado_em DESC, criado_em DESC");
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.nome?.trim() || !body.conteudo?.trim()) {
    return NextResponse.json({ error: "Nome e conteudo sao obrigatorios." }, { status: 400 });
  }

  const template = await dbQueryOne(
    `INSERT INTO cj_comercial_templates (nome, canal, objetivo, tom, assunto, conteudo, ai_gerado, ativo, criado_por, atualizado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
     RETURNING id`,
    [
      body.nome.trim(),
      normalizeChannel(body.canal),
      normalizeObjective(body.objetivo),
      normalizeTone(body.tom),
      body.assunto?.trim() || null,
      body.conteudo.trim(),
      Boolean(body.ai_gerado),
      body.ativo !== false,
      session.id,
    ]
  );

  return NextResponse.json(template, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  await dbRun(
    `UPDATE cj_comercial_templates
        SET nome=$1, canal=$2, objetivo=$3, tom=$4, assunto=$5, conteudo=$6, ai_gerado=$7, ativo=$8, atualizado_em=now()
      WHERE id=$9`,
    [
      body.nome?.trim() || "",
      normalizeChannel(body.canal),
      normalizeObjective(body.objetivo),
      normalizeTone(body.tom),
      body.assunto?.trim() || null,
      body.conteudo?.trim() || "",
      Boolean(body.ai_gerado),
      body.ativo !== false,
      body.id,
    ]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  await dbRun("DELETE FROM cj_comercial_templates WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
