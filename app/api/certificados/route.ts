import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { randomUUID } from "crypto";

type Matricula = { curso_id: string; status: string };
type Aula = { id: string };
type Progresso = { concluido: boolean };
type Cert = { codigo: string; emitido_em: string; nome: string; nome_curso: string; carga_horaria: number };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const codigo = searchParams.get("codigo");
  await initSchema();
  if (codigo) {
    const cert = await dbQueryOne<Cert>(
      `SELECT ce.codigo, ce.emitido_em, u.nome, c.nome AS nome_curso, c.carga_horaria
       FROM cj_certificados ce JOIN cj_users u ON u.id = ce.usuario_id JOIN cj_cursos c ON c.id = ce.curso_id
       WHERE ce.codigo = $1`,
      [codigo]
    );
    if (!cert) return NextResponse.json({ error: "Certificado não encontrado." }, { status: 404 });
    return NextResponse.json(cert);
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const certs = await dbQuery(
    `SELECT ce.id, ce.codigo, ce.emitido_em, c.nome AS nome_curso, c.carga_horaria
     FROM cj_certificados ce JOIN cj_cursos c ON c.id = ce.curso_id WHERE ce.usuario_id=$1 ORDER BY ce.emitido_em DESC`,
    [session.id]
  );
  return NextResponse.json(certs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  await initSchema();
  const { curso_id } = await req.json();
  if (!curso_id) return NextResponse.json({ error: "curso_id obrigatório." }, { status: 400 });

  const matricula = await dbQueryOne<Matricula>(
    "SELECT curso_id, status FROM cj_matriculas WHERE usuario_id=$1 AND curso_id=$2",
    [session.id, curso_id]
  );
  if (!matricula) return NextResponse.json({ error: "Aluno não matriculado neste curso." }, { status: 400 });

  const aulas = await dbQuery<Aula>("SELECT id FROM cj_aulas WHERE curso_id=$1", [curso_id]);
  const progresso = await dbQuery<Progresso>(
    "SELECT concluido FROM cj_progresso WHERE usuario_id=$1 AND aula_id = ANY($2::uuid[])",
    [session.id, aulas.map((a) => a.id)]
  );

  if (progresso.filter((p) => p.concluido).length < aulas.length) {
    return NextResponse.json({ error: "Nem todas as aulas foram concluídas." }, { status: 400 });
  }

  const codigo = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  try {
    await dbRun(
      "INSERT INTO cj_certificados (usuario_id, curso_id, codigo) VALUES ($1,$2,$3)",
      [session.id, curso_id, codigo]
    );
    await dbRun("UPDATE cj_matriculas SET status='concluido' WHERE usuario_id=$1 AND curso_id=$2", [session.id, curso_id]);
    await dbRun(
      "INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo) VALUES ($1, 'Parabéns! Seu certificado foi gerado com sucesso!', 'certificado')",
      [session.id]
    );
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") return NextResponse.json({ error: "Certificado já emitido." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ codigo }, { status: 201 });
}
