import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { usuario_id, curso_id } = await req.json();
  if (!usuario_id || !curso_id) return NextResponse.json({ error: "usuario_id e curso_id são obrigatórios." }, { status: 400 });
  try {
    await dbRun("INSERT INTO cj_matriculas (usuario_id, curso_id) VALUES ($1,$2)", [usuario_id, curso_id]);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") return NextResponse.json({ error: "Aluno já matriculado neste curso." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
