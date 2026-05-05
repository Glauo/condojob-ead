import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const aulaId = searchParams.get("aula_id");
  if (!aulaId) return NextResponse.json({ error: "aula_id obrigatório." }, { status: 400 });
  const atividades = await dbQuery("SELECT id, titulo, tipo, questoes FROM cj_atividades WHERE aula_id=$1 ORDER BY criado_em", [aulaId]);
  return NextResponse.json(atividades);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  await initSchema();
  const { aula_id, titulo, tipo, questoes } = await req.json();
  if (!aula_id || !titulo?.trim()) return NextResponse.json({ error: "aula_id e título são obrigatórios." }, { status: 400 });
  const atv = await dbQueryOne(
    "INSERT INTO cj_atividades (aula_id, titulo, tipo, questoes) VALUES ($1,$2,$3,$4) RETURNING id",
    [aula_id, titulo, tipo || "multipla_escolha", JSON.stringify(questoes || [])]
  );
  return NextResponse.json(atv, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { nota } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbRun("UPDATE cj_submissoes SET nota=$1, status='corrigida' WHERE id=$2", [nota, id]);
  return NextResponse.json({ ok: true });
}
