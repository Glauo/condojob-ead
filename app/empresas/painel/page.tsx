import { redirect } from "next/navigation";
import Link from "next/link";
import { getJobSession } from "@/lib/job-auth";
import { initSchema, dbQuery } from "@/lib/db";
import { JobsCompanyOpportunityForm } from "@/components/jobs-company-opportunity-form";

export const dynamic = "force-dynamic";

type CompanyOpportunity = {
  id: string;
  titulo: string;
  tipo_jornada: string;
  faixa_pagamento: string | null;
  disponibilidade: string | null;
  status: string;
  data_servico: string | null;
  hora_servico: string | null;
  worker_nome: string | null;
  worker_telefone: string | null;
};

export default async function EmpresasPainelPage() {
  await initSchema();
  const session = await getJobSession();
  if (!session || session.perfil !== "company") redirect("/empresas/login");

  const opportunities = await dbQuery<CompanyOpportunity>(
    `SELECT o.id, o.titulo, o.tipo_jornada, o.faixa_pagamento, o.disponibilidade, o.status,
            o.data_servico::text, o.hora_servico::text, w.nome AS worker_nome, w.telefone AS worker_telefone
       FROM cj_job_opportunities o
       LEFT JOIN cj_job_workers w ON w.id = o.worker_id
      WHERE o.condo_id = $1
      ORDER BY o.criado_em DESC`,
    [session.id]
  );

  return (
    <main className="jobs-page-wrap">
      <div className="jobs-page-header">
        <div>
          <div className="jobs-page-eyebrow">Painel da empresa</div>
          <h1 className="jobs-page-title">Vagas e aceites</h1>
          <p className="jobs-page-desc">Cadastre novas vagas e acompanhe em tempo real quais trabalhadores aceitaram cada trabalho.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/profissionais/oportunidades" className="jobs-btn jobs-btn-secondary">Ver vitrine publica</Link>
        </div>
      </div>

      <div className="jobs-panel-block">
        <div className="jobs-panel-block-head">
          <strong>Nova vaga</strong>
          <span>Disponibilidade, data, horario, pagamento e requisitos</span>
        </div>
        <JobsCompanyOpportunityForm />
      </div>

      <div className="jobs-list-grid">
        {opportunities.map((item) => (
          <article key={item.id} className="jobs-card">
            <div className="jobs-card-top">
              <div>
                <div className="jobs-card-title">{item.titulo}</div>
                <div className="jobs-card-subtitle">{item.tipo_jornada}</div>
              </div>
              <span className="jobs-badge">{item.status}</span>
            </div>
            <div className="jobs-card-meta">{[item.data_servico, item.hora_servico].filter(Boolean).join(" | ") || "Data e horario sob alinhamento"}</div>
            <p className="jobs-card-text">{item.disponibilidade || "Sem texto adicional de disponibilidade."}</p>
            <div className="jobs-card-footer">
              <strong>{item.faixa_pagamento || "Pagamento a combinar"}</strong>
              <span>{item.worker_nome ? `Aceito por ${item.worker_nome}${item.worker_telefone ? ` | ${item.worker_telefone}` : ""}` : "Aguardando aceite do trabalhador"}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
