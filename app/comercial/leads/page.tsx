import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { LeadImportModal, LeadModal, LeadStageSelect, LeadWhatsAppButton } from "@/components/comercial-modals";

type Lead = {
  id: string;
  empresa: string;
  nome_contato: string;
  email: string | null;
  whatsapp: string | null;
  cargo: string | null;
  origem: string | null;
  segmento: string | null;
  cidade: string | null;
  score: number;
  valor_potencial: number;
  estagio: string;
  status: string;
  observacoes: string | null;
  ai_resumo: string | null;
  proxima_acao_em: string | null;
  atualizado_em: string;
};

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComercialLeadsPage() {
  const session = await getSession();
  if (!session) redirect("/comercial/login");
  if (session.perfil !== "comercial") redirect(session.perfil === "coordenador" ? "/coordenador" : "/aluno");

  await initSchema();

  const [leads, stats] = await Promise.all([
    dbQuery<Lead>(
      `SELECT *
         FROM cj_comercial_leads
        ORDER BY
          CASE estagio
            WHEN 'mensagem_enviada' THEN 1
            WHEN 'novo' THEN 2
            WHEN 'qualificado' THEN 3
            WHEN 'reuniao' THEN 4
            WHEN 'proposta' THEN 5
            WHEN 'negociacao' THEN 6
            WHEN 'ganho' THEN 7
            ELSE 8
          END,
          atualizado_em DESC`
    ),
    dbQueryOne<{ total: number; quentes: number; ticket: number }>(
      `SELECT
        (SELECT COUNT(*) FROM cj_comercial_leads) AS total,
        (SELECT COUNT(*) FROM cj_comercial_leads WHERE estagio IN ('proposta','negociacao')) AS quentes,
        (SELECT COALESCE(SUM(valor_potencial),0) FROM cj_comercial_leads WHERE status = 'ativo') AS ticket`
    ),
  ]);

  const s = stats || { total: 0, quentes: 0, ticket: 0 };

  return (
    <AppShell breadcrumb="Leads" userName={session.nome} userRole="comercial">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />CRM</div>
          <h1 className="page-title">Cadastro de leads</h1>
          <p className="page-desc">Base completa com origem, score, valor potencial, proxima acao e funil comercial.</p>
        </div>
        <div className="page-actions">
          <LeadImportModal />
          <LeadModal />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Leads totais</div>
          <div className="metric-value">{s.total}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Quentes</div>
          <div className="metric-value">{s.quentes}</div>
          <div className="metric-note">Proposta e negociacao</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Valor potencial</div>
          <div className="metric-value">{currency(Number(s.ticket || 0))}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {leads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhuma lead cadastrada</div>
              <p className="empty-desc">Cadastre as primeiras oportunidades para organizar o funil comercial.</p>
            </div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table commercial-leads-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Contato</th>
                    <th>Origem</th>
                    <th>Etapa</th>
                    <th>Score</th>
                    <th>Valor</th>
                    <th>Proxima acao</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{lead.empresa}</span>
                          <span className="table-name-secondary">{lead.segmento || "Sem segmento"} | {lead.cidade || "Sem cidade"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{lead.nome_contato}</span>
                          <span className="table-name-secondary">{lead.email || "-"} | {lead.whatsapp || "-"}</span>
                        </div>
                      </td>
                      <td>{lead.origem || "-"}</td>
                      <td style={{ minWidth: "170px" }}>
                        <LeadStageSelect leadId={lead.id} value={lead.estagio} />
                      </td>
                      <td>{lead.score}</td>
                      <td>{currency(Number(lead.valor_potencial || 0))}</td>
                      <td style={{ color: "var(--cj-text-muted)" }}>
                        {lead.proxima_acao_em ? new Date(lead.proxima_acao_em).toLocaleString("pt-BR") : "-"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <LeadWhatsAppButton lead={lead} />
                          <LeadModal lead={lead} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
