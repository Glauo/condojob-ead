import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbRun, initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await initSchema();
  const { searchParams } = new URL(req.url);
  const userId = session.perfil === "coordenador" ? (searchParams.get("usuario_id") || null) : session.id;
  const docs = await dbQuery(
    `SELECT d.id, d.tipo, d.nome_arquivo, d.status, d.criado_em, d.enviado_por, d.observacoes, d.arquivo_url, u.nome AS nome_usuario
     FROM cj_documentos d JOIN cj_users u ON u.id = d.usuario_id
     WHERE ${userId ? "d.usuario_id = $1" : "true"}
     ORDER BY d.criado_em DESC`,
    userId ? [userId] : []
  );
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await initSchema();
  const { tipo, nome_arquivo, arquivo_url, usuario_id } = await req.json();
  if (!tipo || !nome_arquivo?.trim()) return NextResponse.json({ error: "Tipo e nome são obrigatórios." }, { status: 400 });
  const uid = session.perfil === "coordenador" && usuario_id ? usuario_id : session.id;
  const enviado = session.perfil === "coordenador" ? "coordenador" : "aluno";
  await dbRun(
    "INSERT INTO cj_documentos (usuario_id, tipo, nome_arquivo, arquivo_url, enviado_por) VALUES ($1,$2,$3,$4,$5)",
    [uid, tipo, nome_arquivo.trim(), arquivo_url || null, enviado]
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id, status, observacoes } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "ID e status são obrigatórios." }, { status: 400 });
  await dbRun("UPDATE cj_documentos SET status=$1, observacoes=$2 WHERE id=$3", [status, observacoes || null, id]);
  return NextResponse.json({ ok: true });
}
