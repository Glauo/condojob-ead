import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun } from "@/lib/db";

export async function GET() {
  const cursos = await dbQuery("SELECT id, nome, descricao, carga_horaria, preco, link_pagamento, nota_minima, criado_em FROM cj_cursos ORDER BY criado_em DESC");
  return NextResponse.json(cursos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { nome, descricao, carga_horaria, preco, link_pagamento, nota_minima, max_tentativas } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  const curso = await dbQueryOne(
    "INSERT INTO cj_cursos (nome, descricao, carga_horaria, preco, link_pagamento, nota_minima, max_tentativas, criado_por) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [nome, descricao || null, carga_horaria || 0, preco || 0, link_pagamento?.trim() || null, nota_minima || 7, max_tentativas || 3, session.id]
  );
  return NextResponse.json(curso, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id, nome, descricao, carga_horaria, preco, link_pagamento, nota_minima, max_tentativas } = await req.json();
  if (!id || !nome?.trim()) return NextResponse.json({ error: "ID e nome são obrigatórios." }, { status: 400 });
  await dbRun(
    "UPDATE cj_cursos SET nome=$1, descricao=$2, carga_horaria=$3, preco=$4, link_pagamento=$5, nota_minima=$6, max_tentativas=$7 WHERE id=$8",
    [nome, descricao || null, carga_horaria || 0, preco || 0, link_pagamento?.trim() || null, nota_minima || 7, max_tentativas || 3, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbRun("DELETE FROM cj_cursos WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
