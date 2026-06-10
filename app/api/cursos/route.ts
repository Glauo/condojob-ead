import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";

function normalizeTipo(value: unknown) {
  return value === "especializacao" ? "especializacao" : "principal";
}

export async function GET() {
  await initSchema();
  const cursos = await dbQuery(
    "SELECT id, nome, descricao, carga_horaria, preco, link_pagamento, tipo, nota_minima, criado_em FROM cj_cursos ORDER BY criado_em DESC"
  );
  return NextResponse.json(cursos);
}

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { nome, descricao, carga_horaria, preco, link_pagamento, tipo, nota_minima, max_tentativas } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome e obrigatorio." }, { status: 400 });

  const curso = await dbQueryOne(
    `INSERT INTO cj_cursos
      (nome, descricao, carga_horaria, preco, link_pagamento, tipo, nota_minima, max_tentativas, criado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [
      nome.trim(),
      descricao || null,
      carga_horaria || 0,
      preco || 0,
      link_pagamento?.trim() || null,
      normalizeTipo(tipo),
      nota_minima || 7,
      max_tentativas || 3,
      session.id,
    ]
  );
  return NextResponse.json(curso, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await initSchema();
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { id, nome, descricao, carga_horaria, preco, link_pagamento, tipo, nota_minima, max_tentativas } = await req.json();
  if (!id || !nome?.trim()) return NextResponse.json({ error: "ID e nome sao obrigatorios." }, { status: 400 });

  await dbRun(
    `UPDATE cj_cursos
        SET nome=$1, descricao=$2, carga_horaria=$3, preco=$4, link_pagamento=$5,
            tipo=$6, nota_minima=$7, max_tentativas=$8
      WHERE id=$9`,
    [
      nome.trim(),
      descricao || null,
      carga_horaria || 0,
      preco || 0,
      link_pagamento?.trim() || null,
      normalizeTipo(tipo),
      nota_minima || 7,
      max_tentativas || 3,
      id,
    ]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await initSchema();
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  await dbRun("DELETE FROM cj_cursos WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
