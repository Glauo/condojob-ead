import { NextRequest, NextResponse } from "next/server";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { normalizeChannel, normalizeStage, requireCommercialSession } from "@/lib/commercial";

async function countAudience(filtroEstagio?: string | null, filtroOrigem?: string | null) {
  const row = await dbQueryOne<{ total: string }>(
    `SELECT COUNT(*)::text AS total
       FROM cj_comercial_leads
      WHERE status = 'ativo'
        AND ($1::text IS NULL OR estagio = $1)
        AND ($2::text IS NULL OR LOWER(COALESCE(origem, '')) = LOWER($2))`,
    [filtroEstagio || null, filtroOrigem || null]
  );
  return Number(row?.total || 0);
}

export async function GET() {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const campanhas = await dbQuery(
    `SELECT c.*, t.nome AS template_nome
       FROM cj_comercial_campanhas c
       LEFT JOIN cj_comercial_templates t ON t.id = c.template_id
      ORDER BY c.atualizado_em DESC, c.criado_em DESC`
  );
  return NextResponse.json(campanhas);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.nome?.trim() || !body.mensagem?.trim()) {
    return NextResponse.json({ error: "Nome e mensagem sao obrigatorios." }, { status: 400 });
  }

  const filtroEstagio = body.filtro_estagio ? normalizeStage(body.filtro_estagio) : null;
  const filtroOrigem = body.filtro_origem?.trim() || null;
  const publicoTotal = await countAudience(filtroEstagio, filtroOrigem);

  const campanha = await dbQueryOne(
    `INSERT INTO cj_comercial_campanhas
      (nome, canal, status, template_id, filtro_estagio, filtro_origem, assunto, mensagem, publico_total, agendado_em, criado_por, atualizado_em)
     VALUES ($1,$2,'rascunho',$3,$4,$5,$6,$7,$8,$9,$10,now())
     RETURNING id`,
    [
      body.nome.trim(),
      normalizeChannel(body.canal),
      body.template_id || null,
      filtroEstagio,
      filtroOrigem,
      body.assunto?.trim() || null,
      body.mensagem.trim(),
      publicoTotal,
      body.agendado_em || null,
      session.id,
    ]
  );

  return NextResponse.json(campanha, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  const filtroEstagio = body.filtro_estagio ? normalizeStage(body.filtro_estagio) : null;
  const filtroOrigem = body.filtro_origem?.trim() || null;
  const publicoTotal = await countAudience(filtroEstagio, filtroOrigem);

  await dbRun(
    `UPDATE cj_comercial_campanhas
        SET nome=$1, canal=$2, template_id=$3, filtro_estagio=$4, filtro_origem=$5, assunto=$6, mensagem=$7,
            publico_total=$8, agendado_em=$9, status=$10, atualizado_em=now()
      WHERE id=$11`,
    [
      body.nome?.trim() || "",
      normalizeChannel(body.canal),
      body.template_id || null,
      filtroEstagio,
      filtroOrigem,
      body.assunto?.trim() || null,
      body.mensagem?.trim() || "",
      publicoTotal,
      body.agendado_em || null,
      body.status || "rascunho",
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
  await dbRun("DELETE FROM cj_comercial_campanhas WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
