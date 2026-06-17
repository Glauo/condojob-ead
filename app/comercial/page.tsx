import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CampanhaModal, LeadModal } from "@/components/comercial-modals";

type Lead = { id: string; empresa: string; nome_contato: string; estagio: string; origem: string | null; score: number; atualizado_em: string };
type Campanha = { id: string; nome: string; canal: string; status: string; publico_total: number; enviados: number; criado_em: string; mensagem: string; assunto: string | null; template_id: string | null; filtro_estagio: string | null; filtro_origem: string | null; agendado_em: string | null };
type Template = { id: string; nome: string; canal: "whatsapp" | "email"; objetivo: string; tom: string; assunto: string | null; conteudo: string; ai_gerado: boolean; ativo: boolean };

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ComercialDashboard() {
  const session = await getSession();
  if (!session) redirect("/comercial/login");
  if (session.perfil !== "comercial") redirect(session.perfil === "coordenador" ? "/coordenador" : "/aluno");

  await initSchema();

  const [stats, leadsRecentes, campanhas, templates, atividades] = await Promise.all([
    dbQueryOne<{ total_leads: number; pipeline_aberto: number; propostas: number; ticket: number; concluidas: number }>(
      `SELECT
        (SELECT COUNT(*) FROM cj_comercial_leads) AS total_leads,
        (SELECT COUNT(*) FROM cj_comercial_leads WHERE status = 'ativo') AS pipeline_aberto,
        (SELECT COUNT(*) FROM cj_comercial_leads WHERE estagio IN ('proposta','negociacao')) AS propostas,
        (SELECT COALESCE(SUM(valor_potencial), 0) FROM cj_comercial_leads WHERE status = 'ativo') AS ticket,
        (SELECT COUNT(*) FROM cj_comercial_campanhas WHERE status = 'concluida') AS concluidas`
    ),
    dbQuery<Lead>(
      `SELECT id, empresa, nome_contato, estagio, origem, score, atualizado_em
         FROM cj_comercial_leads
        ORDER BY atualizado_em DESC, criado_em DESC
        LIMIT 6`
    ),
    dbQuery<Campanha>(
      `SELECT id, nome, canal, status, publico_total, enviados, criado_em, mensagem, assunto, template_id, filtro_estagio, filtro_origem, agendado_em
         FROM cj_comercial_campanhas
        ORDER BY atualizado_em DESC, criado_em DESC
        LIMIT 4`
    ),
    dbQuery<Template>(
      `SELECT id, nome, canal, objetivo, tom, assunto, conteudo, ai_gerado, ativo
         FROM cj_comercial_templates
        WHERE ativo = true
        ORDER BY atualizado_em DESC, criado_em DESC`
    ),
    dbQuery<{ id: string; titulo: string; descricao: string | null; criado_em: string }>(
      `SELECT id, titulo, descricao, criado_em
         FROM cj_comercial_atividades
        ORDER BY criado_em DESC
        LIMIT 8`
    ),
  ]);

  const s = stats || { total_leads: 0, pipeline_aberto: 0, propostas: 0, ticket: 0, concluidas: 0 };

  return (
    <AppShell breadcrumb="Dashboard" userName={session.nome} userRole="comercial">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />CRM Comercial</div>
          <h1 className="page-title">Area Comercial CondoJob</h1>
          <p className="page-desc">Prospeccao, funil, campanhas e relacionamento em uma operacao unica, organizada e premium.</p>
        </div>
        <div className="page-actions">
          <LeadModal />
          <CampanhaModal templates={templates} />
        </div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Leads no CRM</div>
          <div className="metric-value">{s.total_leads}</div>
          <div className="metric-note">Base comercial consolidada</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Pipeline aberto</div>
          <div className="metric-value">{s.pipeline_aberto}</div>
          <div className="metric-note">Leads ativos em acompanhamento</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Propostas quentes</div>
          <div className="metric-value">{s.propostas}</div>
          <div className="metric-note">Proposta e negociacao</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Valor potencial</div>
          <div className="metric-value">{currency(Number(s.ticket || 0))}</div>
          <div className="metric-note">{s.concluidas} campanhas concluidas</div>
        </div>
      </div>

      <div className="content-grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Radar comercial</div>
              <h3 className="section-title">Leads recentes</h3>
            </div>
            <a href="/comercial/leads" className="btn btn-ghost btn-sm">Ver CRM</a>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {leadsRecentes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Nenhuma lead cadastrada</div>
                <p className="empty-desc">Cadastre leads, organize o funil e inicie as campanhas por aqui.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {leadsRecentes.map((lead) => (
                  <div key={lead.id} className="commercial-list-item">
                    <div>
                      <div className="table-name-primary">{lead.empresa}</div>
                      <div className="table-name-secondary">{lead.nome_contato} | {lead.origem || "sem origem"}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="badge badge-teal">{lead.estagio}</span>
                      <span className="badge badge-muted">Score {lead.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Execucao</div>
              <h3 className="section-title">Campanhas recentes</h3>
            </div>
            <a href="/comercial/campanhas" className="btn btn-ghost btn-sm">Ver campanhas</a>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {campanhas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Nenhuma campanha criada</div>
                <p className="empty-desc">Monte campanhas de WhatsApp e e-mail com filtros de publico e templates IA.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {campanhas.map((campanha) => (
                  <div key={campanha.id} className="commercial-list-item">
                    <div>
                      <div className="table-name-primary">{campanha.nome}</div>
                      <div className="table-name-secondary">{campanha.canal} | {campanha.publico_total} leads | {campanha.enviados} enviados</div>
                    </div>
                    <span className={`badge ${campanha.status === "concluida" ? "badge-success" : "badge-warning"}`}>{campanha.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Timeline</div>
            <h3 className="section-title">Ultimas movimentacoes</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "8px" }}>
          {atividades.length === 0 ? (
            <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>A timeline comercial comeca quando leads, funil e campanhas forem usados.</p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {atividades.map((item) => (
                <div key={item.id} className="commercial-list-item">
                  <div>
                    <div className="table-name-primary">{item.titulo}</div>
                    <div className="table-name-secondary">{item.descricao || "Sem detalhe adicional."}</div>
                  </div>
                  <span className="badge badge-muted">{new Date(item.criado_em).toLocaleDateString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
