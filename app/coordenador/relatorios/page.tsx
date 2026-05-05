import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type RelatAluno = { id: string; nome: string; email: string; total_matriculas: number; concluidos: number; media_nota: number | null; ultimo_acesso: string | null };

export default async function RelatoriosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const alunos = await dbQuery<RelatAluno>(
    `SELECT u.id, u.nome, u.email,
      COUNT(DISTINCT m.id) AS total_matriculas,
      COUNT(DISTINCT CASE WHEN m.status = 'concluido' THEN m.id END) AS concluidos,
      ROUND(AVG(s.nota)::NUMERIC, 1) AS media_nota,
      MAX(p.atualizado_em) AS ultimo_acesso
     FROM cj_users u
     LEFT JOIN cj_matriculas m ON m.usuario_id = u.id
     LEFT JOIN cj_submissoes s ON s.usuario_id = u.id AND s.nota IS NOT NULL
     LEFT JOIN cj_progresso p ON p.usuario_id = u.id
     WHERE u.perfil = 'aluno'
     GROUP BY u.id, u.nome, u.email
     ORDER BY u.nome`
  );

  return (
    <AppShell breadcrumb="Relatórios" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Analytics</div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-desc">Acompanhe o desempenho geral de todos os alunos.</p>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total de alunos</div>
          <div className="metric-value">{alunos.length}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Com curso concluído</div>
          <div className="metric-value">{alunos.filter((a) => Number(a.concluidos) > 0).length}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Média geral da turma</div>
          <div className="metric-value">
            {(() => {
              const notas = alunos.filter((a) => a.media_nota !== null).map((a) => Number(a.media_nota));
              return notas.length ? (notas.reduce((s, n) => s + n, 0) / notas.length).toFixed(1) : "—";
            })()}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div><div className="section-eyebrow">Desempenho</div><h3 className="section-title">Relatório individual por aluno</h3></div>
        </div>
        <div className="card-body" style={{ padding: "0" }}>
          {alunos.length === 0 ? (
            <div className="empty-state"><div className="empty-title">Nenhum aluno cadastrado</div></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Aluno</th><th>Matrículas</th><th>Concluídos</th><th>Média de notas</th><th>Último acesso</th><th>Status</th></tr></thead>
              <tbody>
                {alunos.map((a) => {
                  const media = a.media_nota !== null ? Number(a.media_nota) : null;
                  return (
                    <tr key={a.id}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{a.nome}</span>
                          <span className="table-name-secondary">{a.email}</span>
                        </div>
                      </td>
                      <td>{a.total_matriculas}</td>
                      <td>{a.concluidos}</td>
                      <td>
                        {media !== null ? (
                          <span className={`badge ${media >= 7 ? "badge-success" : media >= 5 ? "badge-warning" : "badge-danger"}`}>
                            {media.toFixed(1)}
                          </span>
                        ) : <span className="text-muted text-sm">—</span>}
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>
                        {a.ultimo_acesso ? new Date(a.ultimo_acesso).toLocaleDateString("pt-BR") : "Nunca"}
                      </td>
                      <td>
                        <span className={`badge ${Number(a.concluidos) > 0 ? "badge-success" : Number(a.total_matriculas) > 0 ? "badge-teal" : "badge-muted"}`}>
                          {Number(a.concluidos) > 0 ? "Concluído" : Number(a.total_matriculas) > 0 ? "Em andamento" : "Sem matrícula"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
