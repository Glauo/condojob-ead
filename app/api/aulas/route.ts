import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursoId = searchParams.get("curso_id");
  if (!cursoId) return NextResponse.json({ error: "curso_id obrigatorio." }, { status: 400 });

  const aulas = await dbQuery(
    "SELECT id, titulo, ordem, video_url, conteudo, materiais FROM cj_aulas WHERE curso_id=$1 ORDER BY ordem",
    [cursoId]
  );
  return NextResponse.json(aulas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { curso_id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!curso_id || !titulo?.trim()) {
    return NextResponse.json({ error: "curso_id e titulo sao obrigatorios." }, { status: 400 });
  }
  if (materiais !== undefined && !Array.isArray(materiais)) {
    return NextResponse.json({ error: "Materiais deve ser uma lista." }, { status: 400 });
  }

  const aula = await dbQueryOne(
    "INSERT INTO cj_aulas (curso_id, titulo, ordem, video_url, conteudo, materiais) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id",
    [curso_id, titulo.trim(), ordem || 1, video_url || null, conteudo || null, JSON.stringify(materiais || [])]
  );
  return NextResponse.json(aula, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!id || !titulo?.trim()) {
    return NextResponse.json({ error: "ID e titulo sao obrigatorios." }, { status: 400 });
  }
  if (materiais !== undefined && !Array.isArray(materiais)) {
    return NextResponse.json({ error: "Materiais deve ser uma lista." }, { status: 400 });
  }

  const aula = await dbQueryOne(
    `UPDATE cj_aulas
     SET titulo=$1, ordem=$2, video_url=$3, conteudo=$4, materiais=$5::jsonb
     WHERE id=$6
     RETURNING id, materiais`,
    [titulo.trim(), ordem || 1, video_url || null, conteudo || null, JSON.stringify(materiais || []), id]
  );
  if (!aula) return NextResponse.json({ error: "Aula nao encontrada." }, { status: 404 });

  return NextResponse.json({ ok: true, aula });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  await dbRun("DELETE FROM cj_aulas WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
