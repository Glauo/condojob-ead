import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { NovoAlunoModal, MatricularAlunoModal, EditarAlunoModal } from "@/components/coordenador-modals";

type Aluno = {
  id: string;
  nome: string;
  login: string | null;
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
  total_matriculas: number;
  total_concluidos: number;
};

export default async function AlunosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const alunos = await dbQuery<Aluno>(
    `SELECT u.id, u.nome, u.login, u.email, u.telefone, u.celular_whatsapp,
      TO_CHAR(u.data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
      u.rg, u.cpf, u.estado_civil, u.cep, u.cidade, u.rua, u.numero, u.complemento,
      u.ativo, u.criado_em,
      (SELECT COUNT(*) FROM cj_matriculas WHERE usuario_id = u.id) AS total_matriculas,
      (SELECT COUNT(*) FROM cj_matriculas WHERE usuario_id = u.id AND status = 'concluido') AS total_concluidos
     FROM cj_users u WHERE u.perfil = 'aluno' ORDER BY u.criado_em DESC`
  );

  const cursos = await dbQuery<{ id: string; nome: string }>("SELECT id, nome FROM cj_cursos ORDER BY nome");

  return (
    <AppShell breadcrumb="Alunos" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Gestão</div>
          <h1 className="page-title">Alunos</h1>
          <p className="page-desc">Cadastre, matricule e acompanhe o progresso dos alunos.</p>
        </div>
        <div className="page-actions">
          <NovoAlunoModal />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total cadastrados</div>
          <div className="metric-value">{alunos.length}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Ativos</div>
          <div className="metric-value">{alunos.filter((a) => a.ativo).length}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Cursos concluídos</div>
          <div className="metric-value">{alunos.reduce((s, a) => s + Number(a.total_concluidos), 0)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {alunos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
              </div>
              <div className="empty-title">Nenhum aluno cadastrado</div>
              <p className="empty-desc">Clique em "Novo Aluno" para começar.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Aluno</th><th>Contato</th><th>Matrículas</th><th>Concluídos</th><th>Status</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="table-name-cell">
                        <span className="table-name-primary">{a.nome}</span>
                        <span className="table-name-secondary">{a.email}</span>
                        <span className="table-name-secondary">Login: {a.login || a.email}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>{a.telefone || "—"}</td>
                    <td>{a.total_matriculas}</td>
                    <td>{a.total_concluidos}</td>
                    <td>
                      <span className={`badge ${a.ativo ? "badge-success" : "badge-muted"}`}>
                        {a.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <EditarAlunoModal aluno={a} />
                        <MatricularAlunoModal alunoId={a.id} alunoNome={a.nome} cursos={cursos} />
                        <a href={`/coordenador/alunos/${a.id}`} className="btn btn-ghost btn-sm">Relatório</a>
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
