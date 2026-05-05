import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Pagamento = { id: string; descricao: string; valor: number; status: string; vencimento: string; pago_em: string | null };

const STATUS_BADGE: Record<string, string> = { pendente: "badge-warning", pago: "badge-success", vencido: "badge-danger", cancelado: "badge-muted" };
const STATUS_LABEL: Record<string, string> = { pendente: "Pendente", pago: "Pago", vencido: "Vencido", cancelado: "Cancelado" };

export default async function AlunoFinanceiroPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const pagamentos = await dbQuery<Pagamento>(
    "SELECT id, descricao, valor, status, vencimento, pago_em FROM cj_pagamentos WHERE usuario_id=$1 ORDER BY criado_em DESC",
    [session.id]
  );

  const pendente = pagamentos.filter((p) => p.status === "pendente").reduce((s, p) => s + Number(p.valor), 0);
  const pago = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.valor), 0);

  return (
    <AppShell breadcrumb="Financeiro" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Financeiro</div>
          <h1 className="page-title">Meu Financeiro</h1>
          <p className="page-desc">Acompanhe faturas e histórico de pagamentos.</p>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Em aberto</div>
          <div className="metric-value">R${pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div className="metric-note">{pagamentos.filter((p) => p.status === "pendente").length} fatura(s)</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Total pago</div>
          <div className="metric-value">R${pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total de lançamentos</div>
          <div className="metric-value">{pagamentos.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div><div className="section-eyebrow">Histórico</div><h3 className="section-title">Lançamentos</h3></div>
        </div>
        <div className="card-body" style={{ paddingTop: "8px" }}>
          {pagamentos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Sem lançamentos</div>
              <p className="empty-desc">Nenhum lançamento financeiro registrado.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Pagamento</th><th>Status</th></tr></thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.descricao || "—"}</td>
                    <td style={{ fontWeight: 600 }}>R${Number(p.valor).toFixed(2)}</td>
                    <td style={{ fontSize: "0.8rem" }}>{p.vencimento ? new Date(p.vencimento).toLocaleDateString("pt-BR") : "—"}</td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>{p.pago_em ? new Date(p.pago_em).toLocaleDateString("pt-BR") : "—"}</td>
                    <td><span className={`badge ${STATUS_BADGE[p.status] || "badge-muted"}`}>{STATUS_LABEL[p.status] || p.status}</span></td>
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
