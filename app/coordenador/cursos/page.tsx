import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CursoModal } from "@/components/coordenador-modals";

type Curso = {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  preco: number;
  link_pagamento: string | null;
  tipo: string | null;
  nota_minima: number;
  criado_em: string;
  total_aulas: number;
  total_matriculas: number;
};

export default async function CursosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const cursos = await dbQuery<Curso>(
    `SELECT c.id, c.nome, c.descricao, c.carga_horaria, c.preco, c.link_pagamento,
            COALESCE(c.tipo, 'principal') AS tipo, c.nota_minima, c.criado_em,
            (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = c.id) AS total_aulas,
            (SELECT COUNT(*) FROM cj_matriculas WHERE curso_id = c.id) AS total_matriculas
       FROM cj_cursos c
      ORDER BY c.criado_em DESC`
  );

  return (
    <AppShell breadcrumb="Cursos" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Gestao</div>
          <h1 className="page-title">Cursos</h1>
          <p className="page-desc">Crie e gerencie cursos, especializacoes, aulas e conteudos da plataforma.</p>
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
          <div className="metric-label">Especializacoes</div>
          <div className="metric-value">{cursos.filter((c) => c.tipo === "especializacao").length}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Matriculas totais</div>
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
              <p className="empty-desc">Clique em "Novo Curso" para comecar.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Curso</th><th>Tipo</th><th>Carga</th><th>Nota min.</th><th>Aulas</th><th>Matriculas</th><th>Preco</th><th>Acoes</th></tr>
              </thead>
              <tbody>
                {cursos.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="table-name-cell">
                        <span className="table-name-primary">{c.nome}</span>
                        {c.descricao && <span className="table-name-secondary">{c.descricao.slice(0, 70)}</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.tipo === "especializacao" ? "badge-teal" : "badge-purple"}`}>
                        {c.tipo === "especializacao" ? "Especializacao" : "Principal"}
                      </span>
                    </td>
                    <td>{c.carga_horaria}h</td>
                    <td><span className="badge badge-purple">{Number(c.nota_minima).toFixed(1)}</span></td>
                    <td>{c.total_aulas}</td>
                    <td>{c.total_matriculas}</td>
                    <td>{Number(c.preco) > 0 ? `R$${Number(c.preco).toFixed(2)}` : <span className="text-muted">Gratis</span>}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
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
