import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { tryIssueCertificateForCourse } from "@/lib/certificados";

const MAX_QUESTOES_AVALIACAO = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const aulaId = searchParams.get("aula_id");
  if (id) {
    const atv = await dbQueryOne("SELECT id, titulo, tipo, questoes FROM cj_atividades WHERE id=$1", [id]);
    if (!atv) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    return NextResponse.json(atv);
  }
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
  const total = await dbQueryOne<{ total: string }>("SELECT COUNT(*)::text AS total FROM cj_atividades WHERE aula_id=$1", [aula_id]);
  if (Number(total?.total ?? 0) >= MAX_QUESTOES_AVALIACAO) {
    return NextResponse.json({ error: `Esta avaliacao ja possui ${MAX_QUESTOES_AVALIACAO} questoes.` }, { status: 400 });
  }
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
  const submissao = await dbQueryOne<{ usuario_id: string; curso_id: string }>(
    `SELECT s.usuario_id, a.curso_id
       FROM cj_submissoes s
       JOIN cj_atividades atv ON atv.id = s.atividade_id
       JOIN cj_aulas a ON a.id = atv.aula_id
      WHERE s.id=$1`,
    [id]
  );
  const certificado = submissao
    ? await tryIssueCertificateForCourse(submissao.usuario_id, submissao.curso_id)
    : null;
  return NextResponse.json({ ok: true, certificado });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  const { titulo, tipo, questoes } = await req.json();
  if (!titulo?.trim()) return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
  await dbRun("UPDATE cj_atividades SET titulo=$1, tipo=$2, questoes=$3 WHERE id=$4", [titulo, tipo || "multipla_escolha", JSON.stringify(questoes || []), id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  await dbRun("DELETE FROM cj_atividades WHERE id=$1", [id]);
  return NextResponse.json({ ok: true });
}
