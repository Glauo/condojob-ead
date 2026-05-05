import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { NovoPagamentoModal } from "@/components/financeiro-modals";

type Pag = { id: string; nome_usuario: string; descricao: string; valor: number; status: string; vencimento: string; pago_em: string | null };

const STATUS_BADGE: Record<string, string> = { pendente: "badge-warning", pago: "badge-success", vencido: "badge-danger", cancelado: "badge-muted" };

export default async function FinanceiroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const [pagamentos, stats, alunos, cursos] = await Promise.all([
    dbQuery<Pag>("SELECT p.id, u.nome AS nome_usuario, p.descricao, p.valor, p.status, p.vencimento, p.pago_em FROM cj_pagamentos p JOIN cj_users u ON u.id = p.usuario_id ORDER BY p.criado_em DESC LIMIT 50"),
    dbQueryOne<{ total_pago: number; total_pendente: number; total_vencido: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN status='pago' THEN valor END),0) AS total_pago,
        COALESCE(SUM(CASE WHEN status='pendente' THEN valor END),0) AS total_pendente,
        COALESCE(SUM(CASE WHEN status='vencido' THEN valor END),0) AS total_vencido
       FROM cj_pagamentos`
    ),
    dbQuery<{ id: string; nome: string }>("SELECT id, nome FROM cj_users WHERE perfil='aluno' ORDER BY nome"),
    dbQuery<{ id: string; nome: string }>("SELECT id, nome FROM cj_cursos ORDER BY nome"),
  ]);

  const s = stats ?? { total_pago: 0, total_pendente: 0, total_vencido: 0 };

  return (
    <AppShell breadcrumb="Financeiro" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Financeiro</div>
          <h1 className="page-title">Financeiro</h1>
          <p className="page-desc">Gerencie cobranças, pagamentos e inadimplência.</p>
        </div>
        <div className="page-actions">
          <NovoPagamentoModal alunos={alunos} cursos={cursos} />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-green">
          <div className="metric-label">Total recebido</div>
          <div className="metric-value">R${Number(s.total_pago).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Total pendente</div>
          <div className="metric-value">R${Number(s.total_pendente).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="metric-card metric-card-red">
          <div className="metric-label">Total vencido</div>
          <div className="metric-value">R${Number(s.total_vencido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {pagamentos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum lançamento</div>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Aluno</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th></tr></thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome_usuario}</td>
                    <td style={{ color: "var(--cj-text-muted)", fontSize: "0.82rem" }}>{p.descricao || "—"}</td>
                    <td style={{ fontWeight: 600 }}>R${Number(p.valor).toFixed(2)}</td>
                    <td style={{ fontSize: "0.8rem" }}>{p.vencimento ? new Date(p.vencimento).toLocaleDateString("pt-BR") : "—"}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status] || "badge-muted"}`}>{p.status}</span></td>
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
