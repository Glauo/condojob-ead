import { randomUUID } from "crypto";
import { dbQuery, dbQueryOne, dbRun } from "@/lib/db";

type Certificado = { codigo: string };
type CursoMatricula = { curso_id: string; status: string; nota_minima: number };
type CountRow = { total: string };

export type CertificateIssueResult = {
  issued: boolean;
  eligible: boolean;
  codigo?: string;
  reason?: string;
};

async function getExistingCertificate(usuarioId: string, cursoId: string) {
  return dbQueryOne<Certificado>(
    "SELECT codigo FROM cj_certificados WHERE usuario_id=$1 AND curso_id=$2",
    [usuarioId, cursoId]
  );
}

export async function tryIssueCertificateForCourse(usuarioId: string, cursoId: string): Promise<CertificateIssueResult> {
  const existing = await getExistingCertificate(usuarioId, cursoId);
  if (existing) {
    await dbRun("UPDATE cj_matriculas SET status='concluido' WHERE usuario_id=$1 AND curso_id=$2", [usuarioId, cursoId]);
    return { issued: false, eligible: true, codigo: existing.codigo, reason: "Certificado ja emitido." };
  }

  const matricula = await dbQueryOne<CursoMatricula>(
    `SELECT m.curso_id, m.status, c.nota_minima
       FROM cj_matriculas m
       JOIN cj_cursos c ON c.id = m.curso_id
      WHERE m.usuario_id=$1 AND m.curso_id=$2 AND m.status IN ('ativo','concluido')`,
    [usuarioId, cursoId]
  );
  if (!matricula) return { issued: false, eligible: false, reason: "Aluno sem matricula ativa neste curso." };

  const aulas = await dbQuery<CountRow>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE COALESCE(p.concluido, false))::text AS concluidas
     FROM cj_aulas a
     LEFT JOIN cj_progresso p ON p.aula_id = a.id AND p.usuario_id = $1
     WHERE a.curso_id = $2`,
    [usuarioId, cursoId]
  );
  const totalAulas = Number(aulas[0]?.total ?? 0);
  const aulasConcluidas = Number((aulas[0] as CountRow & { concluidas?: string } | undefined)?.concluidas ?? 0);
  if (totalAulas === 0) return { issued: false, eligible: false, reason: "Curso sem aulas cadastradas." };
  if (aulasConcluidas < totalAulas) {
    return { issued: false, eligible: false, reason: "Ainda existem aulas pendentes." };
  }

  const atividades = await dbQuery<CountRow>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (
         WHERE EXISTS (
           SELECT 1
             FROM cj_submissoes s
            WHERE s.usuario_id = $1
              AND s.atividade_id = atv.id
              AND s.status = 'corrigida'
              AND s.nota >= $3
         )
       )::text AS aprovadas
     FROM cj_atividades atv
     JOIN cj_aulas a ON a.id = atv.aula_id
     WHERE a.curso_id = $2`,
    [usuarioId, cursoId, Number(matricula.nota_minima)]
  );
  const totalAtividades = Number(atividades[0]?.total ?? 0);
  const atividadesAprovadas = Number((atividades[0] as CountRow & { aprovadas?: string } | undefined)?.aprovadas ?? 0);
  if (atividadesAprovadas < totalAtividades) {
    return { issued: false, eligible: false, reason: "Ainda existem avaliacoes pendentes ou abaixo da nota minima." };
  }

  const codigo = randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  const created = await dbQueryOne<Certificado>(
    `INSERT INTO cj_certificados (usuario_id, curso_id, codigo)
     VALUES ($1,$2,$3)
     ON CONFLICT (usuario_id, curso_id) DO NOTHING
     RETURNING codigo`,
    [usuarioId, cursoId, codigo]
  );
  const cert = created ?? await getExistingCertificate(usuarioId, cursoId);
  if (!cert) return { issued: false, eligible: false, reason: "Nao foi possivel emitir o certificado." };

  await dbRun("UPDATE cj_matriculas SET status='concluido' WHERE usuario_id=$1 AND curso_id=$2", [usuarioId, cursoId]);

  if (created) {
    await dbRun(
      `INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo)
       VALUES ($1, 'Parabens! Seu certificado foi liberado automaticamente.', 'certificado')`,
      [usuarioId]
    );
  }

  return { issued: Boolean(created), eligible: true, codigo: cert.codigo };
}

export async function tryIssueCertificateForAula(usuarioId: string, aulaId: string): Promise<CertificateIssueResult> {
  const aula = await dbQueryOne<{ curso_id: string }>("SELECT curso_id FROM cj_aulas WHERE id=$1", [aulaId]);
  if (!aula) return { issued: false, eligible: false, reason: "Aula nao encontrada." };
  return tryIssueCertificateForCourse(usuarioId, aula.curso_id);
}

export async function issuePendingCertificatesForUser(usuarioId: string) {
  const matriculas = await dbQuery<{ curso_id: string }>(
    "SELECT curso_id FROM cj_matriculas WHERE usuario_id=$1 AND status IN ('ativo','concluido')",
    [usuarioId]
  );
  const results: CertificateIssueResult[] = [];
  for (const matricula of matriculas) {
    results.push(await tryIssueCertificateForCourse(usuarioId, matricula.curso_id));
  }
  return results;
}
