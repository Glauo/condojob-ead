import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbRun, initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await initSchema();
  const { searchParams } = new URL(req.url);
  const userId = session.perfil === "coordenador" ? (searchParams.get("usuario_id") || null) : session.id;
  const pags = await dbQuery(
    `SELECT p.id, p.descricao, p.valor, p.status, p.vencimento, p.pago_em, p.criado_em, u.nome AS nome_usuario
     FROM cj_pagamentos p JOIN cj_users u ON u.id = p.usuario_id
     WHERE ${userId ? "p.usuario_id = $1" : "true"}
     ORDER BY p.criado_em DESC`,
    userId ? [userId] : []
  );
  return NextResponse.json(pags);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  await initSchema();
  const { usuario_id, curso_id, descricao, valor, vencimento } = await req.json();
  if (!usuario_id || !valor) return NextResponse.json({ error: "usuario_id e valor são obrigatórios." }, { status: 400 });
  await dbRun(
    "INSERT INTO cj_pagamentos (usuario_id, curso_id, descricao, valor, vencimento) VALUES ($1,$2,$3,$4,$5)",
    [usuario_id, curso_id || null, descricao || null, valor, vencimento || null]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID e status são obrigatórios." }, { status: 400 });
  if (status === "pago") {
    await dbRun("UPDATE cj_pagamentos SET status=$1, pago_em=now() WHERE id=$2", [status, id]);
  } else {
    await dbRun("UPDATE cj_pagamentos SET status=$1, pago_em=NULL WHERE id=$2", [status, id]);
  }
  return NextResponse.json({ ok: true });
}
