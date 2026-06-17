import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { LeadModal, LeadStageSelect } from "@/components/comercial-modals";
import { COMMERCIAL_STAGES } from "@/lib/commercial";

type Lead = {
  id: string;
  empresa: string;
  nome_contato: string;
  email: string | null;
  whatsapp: string | null;
  origem: string | null;
  score: number;
  valor_potencial: number;
  estagio: string;
};

export default async function ComercialFunilPage() {
  const session = await getSession();
  if (!session) redirect("/comercial/login");
  if (session.perfil !== "comercial") redirect(session.perfil === "coordenador" ? "/coordenador" : "/aluno");

  await initSchema();

  const leads = await dbQuery<Lead>(
    `SELECT id, empresa, nome_contato, email, whatsapp, origem, score, valor_potencial, estagio
       FROM cj_comercial_leads
      WHERE status IN ('ativo','ganho','perdido')
      ORDER BY atualizado_em DESC, criado_em DESC`
  );

  return (
    <AppShell breadcrumb="Funil" userName={session.nome} userRole="comercial">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Funil comercial</div>
          <h1 className="page-title">Pipeline de clientes</h1>
          <p className="page-desc">Visao de funil inspirada em CRM moderno, com movimentacao por etapa e leitura rapida das oportunidades.</p>
        </div>
      </div>

      <div className="funnel-board">
        {COMMERCIAL_STAGES.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.estagio === stage.id);
          const total = stageLeads.reduce((sum, lead) => sum + Number(lead.valor_potencial || 0), 0);
          return (
            <section key={stage.id} className="funnel-column">
              <div className="funnel-column-header">
                <div>
                  <div className="funnel-column-title">{stage.label}</div>
                  <div className="funnel-column-meta">{stageLeads.length} lead(s) | {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
                <span className={`badge ${stage.color}`}>{stage.id}</span>
              </div>
              <div className="funnel-column-body">
                {stageLeads.length === 0 ? (
                  <div className="funnel-empty">Nenhuma oportunidade nesta etapa.</div>
                ) : (
                  stageLeads.map((lead) => (
                    <article key={lead.id} className="funnel-card">
                      <div className="funnel-card-top">
                        <div>
                          <div className="table-name-primary">{lead.empresa}</div>
                          <div className="table-name-secondary">{lead.nome_contato}</div>
                        </div>
                        <span className="badge badge-muted">Score {lead.score}</span>
                      </div>
                      <div className="table-name-secondary">{lead.origem || "sem origem"} | {lead.email || lead.whatsapp || "sem contato"}</div>
                      <div className="funnel-card-value">
                        {Number(lead.valor_potencial || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <LeadStageSelect leadId={lead.id} value={lead.estagio} />
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <LeadModal lead={lead} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
