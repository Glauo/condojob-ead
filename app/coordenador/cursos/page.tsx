import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CursoModal, NovoAlunoModal } from "@/components/coordenador-modals";

type Curso = { id: string; nome: string; descricao: string; carga_horaria: number; preco: number; nota_minima: number; criado_em: string; total_aulas: number; total_matriculas: number };

export default async function CursosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const cursos = await dbQuery<Curso>(
    `SELECT c.id, c.nome, c.descricao, c.carga_horaria, c.preco, c.nota_minima, c.criado_em,
      (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = c.id) AS total_aulas,
      (SELECT COUNT(*) FROM cj_matriculas WHERE curso_id = c.id) AS total_matriculas
     FROM cj_cursos c ORDER BY c.criado_em DESC`
  );

  return (
    <AppShell breadcrumb="Cursos" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Gestão</div>
          <h1 className="page-title">Cursos</h1>
          <p className="page-desc">Crie e gerencie cursos, aulas e conteúdos da plataforma.</p>
        </div>
        <div className="page-actions">
          <CursoModal />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total de cursos</div>
          <div className="metric-value">{cursos.length}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Total de aulas</div>
          <div className="metric-value">{cursos.reduce((s, c) => s + Number(c.total_aulas), 0)}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Matrículas totais</div>
          <div className="metric-value">{cursos.reduce((s, c) => s + Number(c.total_matriculas), 0)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {cursos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
              </div>
              <div className="empty-title">Nenhum curso criado</div>
              <p className="empty-desc">Clique em "Novo Curso" para começar.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Curso</th><th>Carga</th><th>Nota mín.</th><th>Aulas</th><th>Matrículas</th><th>Preço</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="table-name-cell">
                        <span className="table-name-primary">{c.nome}</span>
                        {c.descricao && <span className="table-name-secondary">{c.descricao.slice(0, 50)}</span>}
                      </div>
                    </td>
                    <td>{c.carga_horaria}h</td>
                    <td><span className="badge badge-purple">{Number(c.nota_minima).toFixed(1)}</span></td>
                    <td>{c.total_aulas}</td>
                    <td>{c.total_matriculas}</td>
                    <td>{Number(c.preco) > 0 ? `R$${Number(c.preco).toFixed(2)}` : <span className="text-muted">Grátis</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <a href={`/coordenador/cursos/${c.id}`} className="btn btn-ghost btn-sm">Aulas</a>
                        <CursoModal curso={c} />
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
