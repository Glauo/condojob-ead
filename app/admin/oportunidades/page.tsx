import Link from "next/link";
import { initSchema, dbQueryOne, dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type Summary = {
  oportunidades: string;
  candidaturas: string;
  trabalhadores: string;
};

type AdminOpportunity = {
  id: string;
  titulo: string;
  condominio_nome: string;
  tipo_jornada: string;
  ativo: boolean;
  criado_em: string;
};

export default async function AdminOportunidadesPage() {
  await initSchema();

  const [summary, opportunities] = await Promise.all([
    dbQueryOne<Summary>(
      `SELECT
          (SELECT COUNT(*)::text FROM cj_job_opportunities) AS oportunidades,
          (SELECT COUNT(*)::text FROM cj_job_applications) AS candidaturas,
          (SELECT COUNT(*)::text FROM cj_job_workers WHERE ativo = true) AS trabalhadores`
    ),
    dbQuery<AdminOpportunity>(
      `SELECT o.id, o.titulo, c.nome AS condominio_nome, o.tipo_jornada, o.ativo, o.criado_em
         FROM cj_job_opportunities o
         JOIN cj_job_condos c ON c.id = o.condo_id
        ORDER BY o.criado_em DESC`
    ),
  ]);

  return (
    <main className="jobs-page-wrap">
      <div className="jobs-page-header">
        <div>
          <div className="jobs-page-eyebrow">Administracao da plataforma</div>
          <h1 className="jobs-page-title">Visao geral de oportunidades</h1>
          <p className="jobs-page-desc">Painel administrativo da plataforma de empregos da CondoJob.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/" className="jobs-btn jobs-btn-secondary">Voltar para plataforma</Link>
          <Link href="/condominios" className="jobs-btn jobs-btn-primary">Ver condominios</Link>
        </div>
      </div>

      <div className="jobs-summary-grid">
        <div className="jobs-summary-card"><strong>{summary?.oportunidades || "0"}</strong><span>Oportunidades</span></div>
        <div className="jobs-summary-card"><strong>{summary?.candidaturas || "0"}</strong><span>Candidaturas</span></div>
        <div className="jobs-summary-card"><strong>{summary?.trabalhadores || "0"}</strong><span>Profissionais ativos</span></div>
      </div>

      <div className="jobs-list-grid">
        {opportunities.map((item) => (
          <article key={item.id} className="jobs-card">
            <div className="jobs-card-top">
              <div>
                <div className="jobs-card-title">{item.titulo}</div>
                <div className="jobs-card-subtitle">{item.condominio_nome}</div>
              </div>
              <span className={`jobs-badge${item.ativo ? "" : " is-muted"}`}>{item.ativo ? "Ativa" : "Inativa"}</span>
            </div>
            <div className="jobs-card-meta">{item.tipo_jornada}</div>
            <p className="jobs-card-text">Cadastro administrativo de oportunidade dentro da plataforma principal CondoJob.</p>
            <div className="jobs-card-footer">
              <strong>{new Date(item.criado_em).toLocaleDateString("pt-BR")}</strong>
              <span>Registro operacional</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
