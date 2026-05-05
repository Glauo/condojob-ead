import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursoId = searchParams.get("curso_id");
  if (!cursoId) return NextResponse.json({ error: "curso_id obrigatório." }, { status: 400 });
  const aulas = await dbQuery("SELECT id, titulo, ordem, video_url, conteudo, materiais FROM cj_aulas WHERE curso_id=$1 ORDER BY ordem", [cursoId]);
  return NextResponse.json(aulas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { curso_id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!curso_id || !titulo?.trim()) return NextResponse.json({ error: "curso_id e título são obrigatórios." }, { status: 400 });
  const aula = await dbQueryOne(
    "INSERT INTO cj_aulas (curso_id, titulo, ordem, video_url, conteudo, materiais) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
    [curso_id, titulo, ordem || 1, video_url || null, conteudo || null, JSON.stringify(materiais || [])]
  );
  return NextResponse.json(aula, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!id || !titulo?.trim()) return NextResponse.json({ error: "ID e título são obrigatórios." }, { status: 400 });
  await dbRun(
    "UPDATE cj_aulas SET titulo=$1, ordem=$2, video_url=$3, conteudo=$4, materiais=$5 WHERE id=$6",
    [titulo, ordem || 1, video_url || null, conteudo || null, JSON.stringify(materiais || []), id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbRun("DELETE FROM cj_aulas WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
