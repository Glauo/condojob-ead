import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CoordCursoManager } from "@/components/coord-curso-manager";

type Curso = { id: string; nome: string; carga_horaria: number; nota_minima: number };
type Material = { nome: string; url: string };
type AulaRaw = {
  id: string;
  titulo: string;
  ordem: number;
  video_url: string | null;
  conteudo: string | null;
  materiais: Material[];
  total_atividades: number;
};
type Atividade = { id: string; aula_id: string; titulo: string; tipo: string };
type Submissao = {
  id: string;
  aula_titulo: string;
  atividade_titulo: string;
  aluno_nome: string;
  nota: number | null;
  status: string;
  submetido_em: string;
};

export default async function CursoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  const curso = await dbQueryOne<Curso>(
    "SELECT id, nome, carga_horaria, nota_minima FROM cj_cursos WHERE id=$1",
    [id]
  );
  if (!curso) notFound();

  const [aulas, atividades, submissoes] = await Promise.all([
    dbQuery<AulaRaw>(
      `SELECT a.id, a.titulo, a.ordem, a.video_url, a.conteudo,
              COALESCE(a.materiais, '[]') AS materiais,
              COUNT(atv.id)::int AS total_atividades
       FROM cj_aulas a
       LEFT JOIN cj_atividades atv ON atv.aula_id = a.id
       WHERE a.curso_id = $1
       GROUP BY a.id ORDER BY a.ordem ASC, a.id ASC`,
      [id]
    ),
    dbQuery<Atividade>(
      `SELECT id, aula_id, titulo, tipo FROM cj_atividades
       WHERE aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = $1)
       ORDER BY criado_em`,
      [id]
    ),
    dbQuery<Submissao>(
      `SELECT s.id, s.nota, s.status, s.submetido_em::text AS submetido_em,
              u.nome AS aluno_nome, atv.titulo AS atividade_titulo, aula.titulo AS aula_titulo
       FROM cj_submissoes s
       JOIN cj_users u ON u.id = s.usuario_id
       JOIN cj_atividades atv ON atv.id = s.atividade_id
       JOIN cj_aulas aula ON aula.id = atv.aula_id
       WHERE atv.tipo IN ('dissertativa', 'upload')
         AND aula.curso_id = $1
         AND s.status IN ('aguardando_correcao', 'corrigida')
       ORDER BY s.submetido_em DESC`,
      [id]
    ),
  ]);

  return (
    <AppShell breadcrumb={curso.nome} userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Gerenciar curso</div>
          <h1 className="page-title">{curso.nome}</h1>
          <p className="page-desc">
            {aulas.length} módulo{aulas.length !== 1 ? "s" : ""} · Nota mínima: {Number(curso.nota_minima).toFixed(1)}
          </p>
        </div>
        <div className="page-actions">
          <a href="/coordenador/cursos" className="btn btn-ghost btn-sm">← Cursos</a>
        </div>
      </div>

      <CoordCursoManager
        cursoId={id}
        notaMinima={Number(curso.nota_minima)}
        aulas={aulas}
        atividades={atividades}
        submissoes={submissoes}
      />
    </AppShell>
  );
}
