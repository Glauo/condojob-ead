import { NextRequest, NextResponse } from "next/server";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { normalizeStage, requireCommercialSession } from "@/lib/commercial";

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const stage = req.nextUrl.searchParams.get("stage");
  const leads = await dbQuery(
    `SELECT l.*, u.nome AS responsavel_nome
       FROM cj_comercial_leads l
       LEFT JOIN cj_users u ON u.id = l.responsavel_id
      WHERE ($1::text IS NULL OR l.estagio = $1)
      ORDER BY
        CASE l.estagio
          WHEN 'novo' THEN 1
          WHEN 'qualificado' THEN 2
          WHEN 'reuniao' THEN 3
          WHEN 'proposta' THEN 4
          WHEN 'negociacao' THEN 5
          WHEN 'ganho' THEN 6
          ELSE 7
        END,
        l.atualizado_em DESC,
        l.criado_em DESC`,
    [stage]
  );

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.empresa?.trim() || !body.nome_contato?.trim()) {
    return NextResponse.json({ error: "Empresa e contato sao obrigatorios." }, { status: 400 });
  }

  const lead = await dbQueryOne<{ id: string }>(
    `INSERT INTO cj_comercial_leads
      (empresa, nome_contato, email, whatsapp, cargo, origem, segmento, cidade, tags, score, valor_potencial, estagio, status, observacoes, ai_resumo, proxima_acao_em, responsavel_id, criado_por, atualizado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,'ativo',$13,$14,$15,$16,$17,now())
     RETURNING id`,
    [
      body.empresa.trim(),
      body.nome_contato.trim(),
      body.email?.trim() || null,
      body.whatsapp?.trim() || null,
      body.cargo?.trim() || null,
      body.origem?.trim() || "site",
      body.segmento?.trim() || null,
      body.cidade?.trim() || null,
      JSON.stringify(normalizeTags(body.tags)),
      Number(body.score || 50),
      Number(body.valor_potencial || 0),
      normalizeStage(body.estagio),
      body.observacoes?.trim() || null,
      body.ai_resumo?.trim() || null,
      body.proxima_acao_em || null,
      session.id,
      session.id,
    ]
  );

  if (lead) {
    await dbRun(
      `INSERT INTO cj_comercial_atividades (lead_id, tipo, titulo, descricao, criado_por)
       VALUES ($1,'movimentacao','Lead cadastrado',$2,$3)`,
      [lead.id, `Lead criado no estagio ${normalizeStage(body.estagio)}.`, session.id]
    );
  }

  return NextResponse.json(lead, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  const atual = await dbQueryOne<{ id: string; estagio: string }>("SELECT id, estagio FROM cj_comercial_leads WHERE id=$1", [body.id]);
  if (!atual) return NextResponse.json({ error: "Lead nao encontrado." }, { status: 404 });

  const novoEstagio = normalizeStage(body.estagio ?? atual.estagio);
  await dbRun(
    `UPDATE cj_comercial_leads
        SET empresa=$1, nome_contato=$2, email=$3, whatsapp=$4, cargo=$5, origem=$6, segmento=$7, cidade=$8,
            tags=$9::jsonb, score=$10, valor_potencial=$11, estagio=$12, status=$13, observacoes=$14,
            ai_resumo=$15, proxima_acao_em=$16, ultima_interacao_em=$17, atualizado_em=now()
      WHERE id=$18`,
    [
      body.empresa?.trim() || "",
      body.nome_contato?.trim() || "",
      body.email?.trim() || null,
      body.whatsapp?.trim() || null,
      body.cargo?.trim() || null,
      body.origem?.trim() || "site",
      body.segmento?.trim() || null,
      body.cidade?.trim() || null,
      JSON.stringify(normalizeTags(body.tags)),
      Number(body.score || 50),
      Number(body.valor_potencial || 0),
      novoEstagio,
      body.status || (novoEstagio === "ganho" ? "ganho" : novoEstagio === "perdido" ? "perdido" : "ativo"),
      body.observacoes?.trim() || null,
      body.ai_resumo?.trim() || null,
      body.proxima_acao_em || null,
      body.ultima_interacao_em || null,
      body.id,
    ]
  );

  if (novoEstagio !== atual.estagio) {
    await dbRun(
      `INSERT INTO cj_comercial_atividades (lead_id, tipo, titulo, descricao, criado_por)
       VALUES ($1,'movimentacao','Lead movido de etapa',$2,$3)`,
      [body.id, `${atual.estagio} -> ${novoEstagio}`, session.id]
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  await dbRun("DELETE FROM cj_comercial_leads WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
