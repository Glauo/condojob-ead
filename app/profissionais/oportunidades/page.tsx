import Link from "next/link";
import { initSchema, dbQuery } from "@/lib/db";
import { getJobSession } from "@/lib/job-auth";
import { JobsOpportunityApplyButton } from "@/components/jobs-opportunity-apply-button";

export const dynamic = "force-dynamic";

type Opportunity = {
  id: string;
  titulo: string;
  descricao: string | null;
  condominio_nome: string;
  cidade: string | null;
  bairro: string | null;
  tipo_jornada: string;
  faixa_pagamento: string | null;
  requisitos: string | null;
  disponibilidade: string | null;
  data_servico: string | null;
  hora_servico: string | null;
  status: string;
  worker_id: string | null;
};

export default async function ProfissionaisOportunidadesPage() {
  await initSchema();
  const session = await getJobSession();

  const opportunities = await dbQuery<Opportunity>(
    `SELECT o.id, o.titulo, o.descricao, c.nome AS condominio_nome, c.cidade, c.bairro,
            o.tipo_jornada, o.faixa_pagamento, o.requisitos, o.disponibilidade,
            o.data_servico::text, o.hora_servico::text, o.status, o.worker_id
       FROM cj_job_opportunities o
       JOIN cj_job_condos c ON c.id = o.condo_id
      WHERE o.ativo = true
      ORDER BY o.criado_em DESC`
  );

  return (
    <main className="jobs-page-wrap">
      <div className="jobs-page-header">
        <div>
          <div className="jobs-page-eyebrow">Profissionais</div>
          <h1 className="jobs-page-title">Oportunidades CondoJob</h1>
          <p className="jobs-page-desc">Vagas com disponibilidade, detalhes da operacao e aceite imediato pelo trabalhador dentro da plataforma.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/" className="jobs-btn jobs-btn-secondary">Voltar para plataforma</Link>
          <Link href={session?.perfil === "worker" ? "/profissionais/painel" : "/profissionais/login"} className="jobs-btn jobs-btn-primary">
            {session?.perfil === "worker" ? "Meu painel" : "Entrar como trabalhador"}
          </Link>
        </div>
      </div>

      <div className="jobs-list-grid">
        {opportunities.map((item) => (
          <article key={item.id} className="jobs-card">
            <div className="jobs-card-top">
              <div>
                <div className="jobs-card-title">{item.titulo}</div>
                <div className="jobs-card-subtitle">{item.condominio_nome}</div>
              </div>
              <span className="jobs-badge">{item.tipo_jornada}</span>
            </div>
            <div className="jobs-card-meta">
              {[item.bairro, item.cidade].filter(Boolean).join(" | ") || "Local informado no processo seletivo"}
            </div>
            <p className="jobs-card-text">{item.descricao || "Oportunidade aberta para profissionais do setor condominial."}</p>
            <div className="jobs-card-meta">
              {[item.disponibilidade, item.data_servico, item.hora_servico].filter(Boolean).join(" | ") || "Disponibilidade sob alinhamento"}
            </div>
            <div className="jobs-card-footer">
              <strong>{item.faixa_pagamento || "Pagamento a combinar"}</strong>
              <span>{item.requisitos || "Requisitos informados no cadastro da vaga."}</span>
            </div>
            <div className="jobs-card-actions">
              {session?.perfil === "worker" ? (
                <JobsOpportunityApplyButton
                  opportunityId={item.id}
                  disabled={item.status !== "aberta" && item.worker_id !== session.id}
                  accepted={item.worker_id === session.id}
                />
              ) : (
                <div className="jobs-action-stack">
                  <Link href="/profissionais/login" className="jobs-btn jobs-btn-primary">Entrar para aceitar</Link>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
