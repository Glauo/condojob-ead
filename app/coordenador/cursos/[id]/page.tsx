import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AulaModal } from "@/components/coordenador-modals";

type Curso = { id: string; nome: string; carga_horaria: number; nota_minima: number };
type Aula = { id: string; titulo: string; ordem: number; video_url: string | null; total_atividades: number };

export default async function CursoDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  const curso = await dbQueryOne<Curso>("SELECT id, nome, carga_horaria, nota_minima FROM cj_cursos WHERE id=$1", [id]);
  if (!curso) notFound();

  const aulas = await dbQuery<Aula>(
    `SELECT a.id, a.titulo, a.ordem, a.video_url,
      (SELECT COUNT(*) FROM cj_atividades WHERE aula_id = a.id) AS total_atividades
     FROM cj_aulas a WHERE a.curso_id=$1 ORDER BY a.ordem`,
    [id]
  );

  return (
    <AppShell breadcrumb={curso.nome} userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />{curso.nome}</div>
          <h1 className="page-title">Aulas do curso</h1>
          <p className="page-desc">{aulas.length} aulas · Nota mínima: {Number(curso.nota_minima).toFixed(1)}</p>
        </div>
        <div className="page-actions">
          <a href="/coordenador/cursos" className="btn btn-ghost btn-sm">← Cursos</a>
          <AulaModal cursoId={id} />
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {aulas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
              </div>
              <div className="empty-title">Nenhuma aula criada</div>
              <p className="empty-desc">Clique em "+ Nova Aula" para adicionar conteúdo ao curso.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>#</th><th>Título</th><th>Vídeo</th><th>Atividades</th><th>Ações</th></tr></thead>
              <tbody>
                {aulas.map((a) => (
                  <tr key={a.id}>
                    <td><span className="badge badge-purple">{String(a.ordem).padStart(2, "0")}</span></td>
                    <td><span style={{ fontWeight: 600, color: "var(--cj-text)" }}>{a.titulo}</span></td>
                    <td>
                      {a.video_url
                        ? <span className="badge badge-success"><span className="badge-dot" />Sim</span>
                        : <span className="badge badge-muted">Não</span>}
                    </td>
                    <td>{a.total_atividades}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a href={`/coordenador/atividades?aula_id=${a.id}`} className="btn btn-ghost btn-sm">Atividades</a>
                        <AulaModal cursoId={id} aula={{ ...a, video_url: a.video_url ?? undefined }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
