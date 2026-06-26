import Link from "next/link";
import { initSchema, dbQuery } from "@/lib/db";

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
};

export default async function ProfissionaisOportunidadesPage() {
  await initSchema();

  const opportunities = await dbQuery<Opportunity>(
    `SELECT o.id, o.titulo, o.descricao, c.nome AS condominio_nome, c.cidade, c.bairro,
            o.tipo_jornada, o.faixa_pagamento, o.requisitos
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
          <p className="jobs-page-desc">Vagas e oportunidades do setor condominial dentro da plataforma principal.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/" className="jobs-btn jobs-btn-secondary">Voltar para plataforma</Link>
          <Link href="/curso-assistente-condominial" className="jobs-btn jobs-btn-primary">Ir para CondoJob EAD</Link>
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
            <div className="jobs-card-footer">
              <strong>{item.faixa_pagamento || "Pagamento a combinar"}</strong>
              <span>{item.requisitos || "Requisitos informados no cadastro da vaga."}</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
