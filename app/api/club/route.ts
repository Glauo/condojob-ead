import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function hasPremiumAccess(userId: string) {
  const row = await dbQueryOne<{ ok: boolean }>(
    `SELECT true AS ok
       FROM cj_matriculas m
       JOIN cj_cursos c ON c.id = m.curso_id
      WHERE m.usuario_id=$1
        AND m.status IN ('ativo','concluido')
        AND (c.preco > 0 OR c.nome ILIKE '%premium%')
      LIMIT 1`,
    [userId]
  );
  return Boolean(row?.ok);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  await initSchema();

  if (session.perfil === "aluno" && !(await hasPremiumAccess(session.id))) {
    return NextResponse.json({ acessoPremium: false, beneficios: [] });
  }

  const beneficios = await dbQuery(
    `SELECT id, nome_empresa, categoria, descricao, desconto, cupom, link_url, contato,
            endereco, regras, ativo, criado_em, atualizado_em
       FROM cj_club_beneficios
      WHERE ${session.perfil === "coordenador" ? "true" : "ativo = true"}
      ORDER BY ativo DESC, categoria, nome_empresa`
  );

  return NextResponse.json({ acessoPremium: true, beneficios });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  await initSchema();
  const body = await req.json();
  const nomeEmpresa = clean(body.nome_empresa);
  const categoria = clean(body.categoria);
  const desconto = clean(body.desconto);

  if (!nomeEmpresa || !categoria || !desconto) {
    return NextResponse.json({ error: "Empresa, categoria e desconto sao obrigatorios." }, { status: 400 });
  }

  const row = await dbQueryOne(
    `INSERT INTO cj_club_beneficios
      (nome_empresa, categoria, descricao, desconto, cupom, link_url, contato, endereco, regras, ativo, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      nomeEmpresa,
      categoria,
      clean(body.descricao),
      desconto,
      clean(body.cupom),
      clean(body.link_url),
      clean(body.contato),
      clean(body.endereco),
      clean(body.regras),
      body.ativo ?? true,
      session.id,
    ]
  );

  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  await initSchema();
  const body = await req.json();
  const id = clean(body.id);
  const nomeEmpresa = clean(body.nome_empresa);
  const categoria = clean(body.categoria);
  const desconto = clean(body.desconto);

  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  if (!nomeEmpresa || !categoria || !desconto) {
    return NextResponse.json({ error: "Empresa, categoria e desconto sao obrigatorios." }, { status: 400 });
  }

  await dbRun(
    `UPDATE cj_club_beneficios SET
      nome_empresa=$1, categoria=$2, descricao=$3, desconto=$4, cupom=$5, link_url=$6,
      contato=$7, endereco=$8, regras=$9, ativo=$10, atualizado_em=now()
     WHERE id=$11`,
    [
      nomeEmpresa,
      categoria,
      clean(body.descricao),
      desconto,
      clean(body.cupom),
      clean(body.link_url),
      clean(body.contato),
      clean(body.endereco),
      clean(body.regras),
      body.ativo ?? true,
      id,
    ]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  await initSchema();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  await dbRun("DELETE FROM cj_club_beneficios WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
