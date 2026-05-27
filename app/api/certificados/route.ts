import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { tryIssueCertificateForCourse } from "@/lib/certificados";

type Matricula = { curso_id: string; status: string };
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
    if (!cert) return NextResponse.json({ error: "Certificado nao encontrado." }, { status: 404 });
    return NextResponse.json(cert);
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  const certs = await dbQuery(
    `SELECT ce.id, ce.codigo, ce.emitido_em, c.nome AS nome_curso, c.carga_horaria
     FROM cj_certificados ce JOIN cj_cursos c ON c.id = ce.curso_id WHERE ce.usuario_id=$1 ORDER BY ce.emitido_em DESC`,
    [session.id]
  );
  return NextResponse.json(certs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  await initSchema();
  const { curso_id } = await req.json();
  if (!curso_id) return NextResponse.json({ error: "curso_id obrigatorio." }, { status: 400 });

  const matricula = await dbQueryOne<Matricula>(
    "SELECT curso_id, status FROM cj_matriculas WHERE usuario_id=$1 AND curso_id=$2",
    [session.id, curso_id]
  );
  if (!matricula) return NextResponse.json({ error: "Aluno nao matriculado neste curso." }, { status: 400 });

  const result = await tryIssueCertificateForCourse(session.id, curso_id);
  if (!result.eligible) {
    return NextResponse.json({ error: result.reason || "Curso ainda nao concluido." }, { status: 400 });
  }

  return NextResponse.json(
    { codigo: result.codigo, issued: result.issued },
    { status: result.issued ? 201 : 200 }
  );
}
