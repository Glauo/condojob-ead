import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AtividadeModal, CorrigirModal, EditAtividadeModal } from "@/components/atividade-modals";

type Atividade = { id: string; titulo: string; tipo: string; aula_titulo: string; curso_nome: string; total_submissoes: number; pendentes: number; total_matriculados: number };
type Submissao = { id: string; nome_aluno: string; titulo_atividade: string; submetido_em: string; nota: number | null; status: string; respostas: string };

export default async function AtividadesPage({ searchParams }: { searchParams: Promise<{ aula_id?: string }> }) {
  const { aula_id } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const [atividades, submissoesPendentes, aulas] = await Promise.all([
    dbQuery<Atividade>(
      `SELECT at.id, at.titulo, at.tipo,
        a.titulo AS aula_titulo,
        c.nome AS curso_nome,
        (SELECT COUNT(*) FROM cj_submissoes WHERE atividade_id = at.id) AS total_submissoes,
        (SELECT COUNT(*) FROM cj_submissoes WHERE atividade_id = at.id AND status = 'aguardando_correcao') AS pendentes,
        (SELECT COUNT(*) FROM cj_matriculas WHERE curso_id = a.curso_id AND status = 'ativo') AS total_matriculados
       FROM cj_atividades at
       JOIN cj_aulas a ON a.id = at.aula_id
       JOIN cj_cursos c ON c.id = a.curso_id
       ${aula_id ? "WHERE at.aula_id = $1" : ""}
       ORDER BY c.nome, a.ordem, at.titulo`,
      aula_id ? [aula_id] : []
    ),
    dbQuery<Submissao>(
      `SELECT s.id, u.nome AS nome_aluno, at.titulo AS titulo_atividade, s.submetido_em, s.nota, s.status, s.respostas
       FROM cj_submissoes s
       JOIN cj_users u ON u.id = s.usuario_id
       JOIN cj_atividades at ON at.id = s.atividade_id
       WHERE s.status = 'aguardando_correcao'
       ORDER BY s.submetido_em DESC`
    ),
    dbQuery<{ id: string; titulo: string; curso_nome: string }>(
      `SELECT a.id, a.titulo, c.nome AS curso_nome FROM cj_aulas a JOIN cj_cursos c ON c.id = a.curso_id ORDER BY c.nome, a.ordem`
    ),
  ]);

  const aulaAtual = aula_id ? await dbQueryOne<{ titulo: string; curso_id: string }>("SELECT titulo, curso_id FROM cj_aulas WHERE id=$1", [aula_id]) : null;

  return (
    <AppShell breadcrumb="Atividades" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />{aulaAtual ? aulaAtual.titulo : "Gestão"}</div>
          <h1 className="page-title">Atividades Avaliativas</h1>
          <p className="page-desc">{submissoesPendentes.length} atividades aguardando correção manual.</p>
        </div>
        <div className="page-actions">
          {aula_id && <AtividadeModal aulaId={aula_id} />}
        </div>
      </div>

      {submissoesPendentes.length > 0 && (
        <div className="card" style={{ borderColor: "rgba(243,156,18,0.3)" }}>
          <div className="card-header">
            <div><div className="section-eyebrow" style={{ color: "var(--cj-warning)" }}>Pendentes</div><h3 className="section-title">Aguardando correção manual</h3></div>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            <table className="data-table">
              <thead><tr><th>Aluno</th><th>Atividade</th><th>Enviado em</th><th>Ação</th></tr></thead>
              <tbody>
                {submissoesPendentes.map((s) => (
                  <tr key={s.id}>
                    <td>{s.nome_aluno}</td>
                    <td style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>{s.titulo_atividade}</td>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(s.submetido_em).toLocaleDateString("pt-BR")}</td>
                    <td><CorrigirModal submissao={s} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div><div className="section-eyebrow">Banco de questões</div><h3 className="section-title">Todas as atividades</h3></div>
        </div>
        <div className="card-body" style={{ padding: "0" }}>
          {atividades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhuma atividade criada</div>
              <p className="empty-desc">{aula_id ? "Clique em \"Nova Atividade\" para criar." : "Acesse uma aula específica para criar atividades."}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Título</th><th>Tipo</th><th>Turma</th><th>Módulo</th><th>Andamento</th><th>Pendentes</th><th>Ações</th></tr></thead>
              <tbody>
                {atividades.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.titulo}</td>
                    <td><span className="badge badge-purple">{a.tipo.replace("_", " ")}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text)" }}>{a.curso_nome}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>{a.aula_titulo}</td>
                    <td style={{ fontSize: "0.82rem" }}>
                      {a.total_submissoes}/{a.total_matriculados}
                      {Number(a.total_matriculados) > 0 && (
                        <span style={{ color: "var(--cj-text-muted)", marginLeft: "4px" }}>
                          ({Math.round((Number(a.total_submissoes) / Number(a.total_matriculados)) * 100)}%)
                        </span>
                      )}
                    </td>
                    <td>{Number(a.pendentes) > 0 ? <span className="badge badge-warning">{a.pendentes}</span> : "0"}</td>
                    <td><EditAtividadeModal atividadeId={a.id} /></td>
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
