import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { startCommercialCampaignScheduler } from "@/lib/commercial-scheduler";
import { AppShell } from "@/components/app-shell";
import { CampanhaAutoButton, CampanhaDisparoButton, CampanhaModal, TemplateModal } from "@/components/comercial-modals";

type Template = {
  id: string;
  nome: string;
  canal: "whatsapp" | "email";
  objetivo: string;
  tom: string;
  assunto: string | null;
  conteudo: string;
  ai_gerado: boolean;
  ativo: boolean;
};

type Campanha = {
  id: string;
  nome: string;
  canal: "whatsapp" | "email";
  status: string;
  template_id: string | null;
  filtro_estagio: string | null;
  filtro_origem: string | null;
  assunto: string | null;
  mensagem: string;
  publico_total: number;
  enviados: number;
  entregues: number;
  agendado_em: string | null;
  criado_em: string;
};

export default async function ComercialCampanhasPage() {
  startCommercialCampaignScheduler();
  const session = await getSession();
  if (!session) redirect("/comercial/login");
  if (session.perfil !== "comercial") redirect(session.perfil === "coordenador" ? "/coordenador" : "/aluno");

  await initSchema();

  const [templates, campanhas, stats] = await Promise.all([
    dbQuery<Template>("SELECT * FROM cj_comercial_templates ORDER BY atualizado_em DESC, criado_em DESC"),
    dbQuery<Campanha>("SELECT * FROM cj_comercial_campanhas ORDER BY atualizado_em DESC, criado_em DESC"),
    dbQueryOne<{ templates: number; campanhas: number; disparos: number }>(
      `SELECT
        (SELECT COUNT(*) FROM cj_comercial_templates) AS templates,
        (SELECT COUNT(*) FROM cj_comercial_campanhas) AS campanhas,
        (SELECT COUNT(*) FROM cj_comercial_disparos) AS disparos`
    ),
  ]);

  const s = stats || { templates: 0, campanhas: 0, disparos: 0 };

  return (
    <AppShell breadcrumb="Campanhas" userName={session.nome} userRole="comercial">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Automacao comercial</div>
          <h1 className="page-title">Campanhas e mensagens IA</h1>
          <p className="page-desc">Disparos em massa por WhatsApp e e-mail, com biblioteca de mensagens, filtros de publico e copys prontas.</p>
        </div>
        <div className="page-actions">
          <TemplateModal />
          <CampanhaModal templates={templates} />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Templates IA</div>
          <div className="metric-value">{s.templates}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Campanhas</div>
          <div className="metric-value">{s.campanhas}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Disparos registrados</div>
          <div className="metric-value">{s.disparos}</div>
        </div>
      </div>

      <div className="metric-grid metric-grid-3" style={{ marginTop: "18px" }}>
        <div className="card">
          <div className="card-body" style={{ display: "grid", gap: "12px" }}>
            <div>
              <div className="section-eyebrow">Disparo em massa</div>
              <div className="section-title" style={{ fontSize: "1.02rem" }}>WhatsApp em massa</div>
            </div>
            <p style={{ color: "var(--cj-text-secondary)", margin: 0 }}>
              Cria uma campanha para enviar mensagens por WhatsApp para varios leads com filtro por etapa e origem.
            </p>
            <div>
              <CampanhaModal
                templates={templates}
                defaultCanal="whatsapp"
                buttonLabel="Nova campanha WhatsApp"
                buttonClassName="btn btn-primary"
              />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: "grid", gap: "12px" }}>
            <div>
              <div className="section-eyebrow">Disparo em massa</div>
              <div className="section-title" style={{ fontSize: "1.02rem" }}>E-mail em massa</div>
            </div>
            <p style={{ color: "var(--cj-text-secondary)", margin: 0 }}>
              Cria uma campanha para enviar e-mails em lote usando assunto, mensagem e filtros do funil comercial.
            </p>
            <div>
              <CampanhaModal
                templates={templates}
                defaultCanal="email"
                buttonLabel="Nova campanha E-mail"
                buttonClassName="btn btn-secondary"
              />
            </div>
          </div>
        </div>
      </div>

      <div id="templates" className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Biblioteca IA</div>
            <h3 className="section-title">Templates comerciais</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "10px" }}>
          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum template cadastrado</div>
              <p className="empty-desc">Crie templates de prospeccao, follow-up, reativacao e fechamento.</p>
            </div>
          ) : (
            <div className="course-grid">
              {templates.map((template) => (
                <div key={template.id} className="course-card">
                  <div className="course-card-body">
                    <div className="course-card-num">{template.canal} | {template.objetivo} | {template.tom}</div>
                    <div className="course-card-title">{template.nome}</div>
                    <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.84rem" }}>
                      {(template.assunto || template.conteudo).slice(0, 200)}
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <span className={`badge ${template.ai_gerado ? "badge-teal" : "badge-muted"}`}>{template.ai_gerado ? "IA" : "Manual"}</span>
                      <span className={`badge ${template.ativo ? "badge-success" : "badge-muted"}`}>{template.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                    <div className="specialization-card-actions">
                      <TemplateModal template={template} />
                    </div>
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
            <h3 className="section-title">Campanhas em massa</h3>
          </div>
        </div>
        <div className="card-body" style={{ padding: "0" }}>
          {campanhas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhuma campanha criada</div>
              <p className="empty-desc">Crie campanhas com filtro por etapa e origem para disparar em lote.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Campanha</th><th>Canal</th><th>Publico</th><th>Status</th><th>Envios</th><th>Acoes</th></tr>
              </thead>
              <tbody>
                {campanhas.map((campanha) => (
                  <tr key={campanha.id}>
                    <td>
                      <div className="table-name-cell">
                        <span className="table-name-primary">{campanha.nome}</span>
                        <span className="table-name-secondary">
                          {(campanha.filtro_estagio || "todos os estagios")} | {(campanha.filtro_origem || "todas as origens")}
                          {campanha.agendado_em ? ` | agendada para ${new Date(campanha.agendado_em).toLocaleString("pt-BR")}` : ""}
                        </span>
                      </div>
                    </td>
                    <td>{campanha.canal}</td>
                    <td>{campanha.publico_total}</td>
                    <td><span className={`badge ${campanha.status === "concluida" ? "badge-success" : "badge-warning"}`}>{campanha.status}</span></td>
                    <td>{campanha.enviados}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <CampanhaAutoButton campanhaId={campanha.id} enabled={campanha.status === "agendada"} />
                        <CampanhaDisparoButton campanhaId={campanha.id} />
                        <CampanhaModal campanha={campanha} templates={templates} />
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
