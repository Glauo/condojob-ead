import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { EditarAlunoModal } from "@/components/coordenador-modals";

type Aluno = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  celular_whatsapp: string | null;
  data_nascimento: string | null;
  rg: string | null;
  cpf: string | null;
  estado_civil: string | null;
  cep: string | null;
  cidade: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  ativo: boolean;
  criado_em: string;
};
type Matricula = { curso_nome: string; status: string; total_aulas: number; concluidas: number; matriculado_em: string };
type Nota = { titulo_atividade: string; aula_titulo: string; nota: number; status: string; submetido_em: string };

export default async function AlunoRelatorio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  const aluno = await dbQueryOne<Aluno>(
    `SELECT id, nome, email, telefone, celular_whatsapp,
      TO_CHAR(data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
      rg, cpf, estado_civil, cep, cidade, rua, numero, complemento, ativo, criado_em
     FROM cj_users WHERE id=$1 AND perfil='aluno'`,
    [id]
  );
  if (!aluno) notFound();

  const [matriculas, notas] = await Promise.all([
    dbQuery<Matricula>(
      `SELECT c.nome AS curso_nome, m.status, m.matriculado_em,
        (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = m.curso_id) AS total_aulas,
        (SELECT COUNT(*) FROM cj_progresso p WHERE p.usuario_id = $1 AND p.concluido = true AND p.aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = m.curso_id)) AS concluidas
       FROM cj_matriculas m JOIN cj_cursos c ON c.id = m.curso_id WHERE m.usuario_id = $1 ORDER BY m.matriculado_em DESC`,
      [id]
    ),
    dbQuery<Nota>(
      `SELECT at.titulo AS titulo_atividade, a.titulo AS aula_titulo, s.nota, s.status, s.submetido_em
       FROM cj_submissoes s
       JOIN cj_atividades at ON at.id = s.atividade_id
       JOIN cj_aulas a ON a.id = at.aula_id
       WHERE s.usuario_id = $1
       ORDER BY s.submetido_em DESC`,
      [id]
    ),
  ]);

  const mediaNotas = notas.filter((n) => n.nota !== null).length
    ? notas.filter((n) => n.nota !== null).reduce((s, n) => s + Number(n.nota), 0) / notas.filter((n) => n.nota !== null).length
    : null;

  return (
    <AppShell breadcrumb={aluno.nome} userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Relatório individual</div>
          <h1 className="page-title">{aluno.nome}</h1>
          <p className="page-desc">{aluno.email} {aluno.telefone ? `· ${aluno.telefone}` : ""} · Cadastrado em {new Date(aluno.criado_em).toLocaleDateString("pt-BR")}</p>
        </div>
        <div className="page-actions">
          <EditarAlunoModal aluno={aluno} />
          <a href="/coordenador/alunos" className="btn btn-ghost btn-sm">← Alunos</a>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Cursos matriculados</div>
          <div className="metric-value">{matriculas.length}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Concluídos</div>
          <div className="metric-value">{matriculas.filter((m) => m.status === "concluido").length}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Média de notas</div>
          <div className="metric-value">{mediaNotas !== null ? mediaNotas.toFixed(1) : "—"}</div>
        </div>
      </div>

      <div className="content-grid grid-2">
        <div className="card">
          <div className="card-header"><div><div className="section-eyebrow">Formação</div><h3 className="section-title">Cursos</h3></div></div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px" }}>
            {matriculas.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>Sem matrículas.</p>
            ) : matriculas.map((m, i) => {
              const total = Number(m.total_aulas) || 1;
              const conc = Number(m.concluidas) || 0;
              const pct = Math.round((conc / total) * 100);
              return (
                <div key={i} style={{ background: "var(--cj-dark)", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius)", padding: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.curso_nome}</div>
                    <span className={`badge ${m.status === "concluido" ? "badge-success" : "badge-purple"}`}>{m.status}</span>
                  </div>
                  <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
                  <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "4px" }}>{conc}/{total} aulas · {pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div><div className="section-eyebrow">Avaliações</div><h3 className="section-title">Histórico de notas</h3></div></div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {notas.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>Nenhuma atividade submetida.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Atividade</th><th>Nota</th><th>Status</th></tr></thead>
                <tbody>
                  {notas.map((n, i) => (
                    <tr key={i}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{n.titulo_atividade}</span>
                          <span className="table-name-secondary">{n.aula_titulo}</span>
                        </div>
                      </td>
                      <td>
                        {n.nota !== null
                          ? <span className={`badge ${Number(n.nota) >= 7 ? "badge-success" : Number(n.nota) >= 5 ? "badge-warning" : "badge-danger"}`}>{Number(n.nota).toFixed(1)}</span>
                          : <span className="text-muted text-sm">—</span>}
                      </td>
                      <td><span className={`badge ${n.status === "corrigida" ? "badge-success" : "badge-warning"}`}>{n.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
