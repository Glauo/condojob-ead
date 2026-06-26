import Link from "next/link";
import { initSchema, dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type Condo = {
  id: string;
  nome: string;
  cidade: string | null;
  bairro: string | null;
  tipo: string;
  premium: boolean;
  total_unidades: number | null;
};

export default async function CondominiosPage() {
  await initSchema();

  const condos = await dbQuery<Condo>(
    `SELECT id, nome, cidade, bairro, tipo, premium, total_unidades
       FROM cj_job_condos
      WHERE ativo = true
      ORDER BY premium DESC, nome ASC`
  );

  return (
    <main className="jobs-page-wrap">
      <div className="jobs-page-header">
        <div>
          <div className="jobs-page-eyebrow">Condominios e empresas</div>
          <h1 className="jobs-page-title">Base cadastrada da plataforma</h1>
          <p className="jobs-page-desc">Condominios cadastrados na CondoJob para operacao, contratacao e acompanhamento.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/" className="jobs-btn jobs-btn-secondary">Voltar para plataforma</Link>
          <Link href="/profissionais/oportunidades" className="jobs-btn jobs-btn-primary">Ver oportunidades</Link>
        </div>
      </div>

      <div className="jobs-list-grid">
        {condos.map((item) => (
          <article key={item.id} className="jobs-card">
            <div className="jobs-card-top">
              <div>
                <div className="jobs-card-title">{item.nome}</div>
                <div className="jobs-card-subtitle">{item.tipo}</div>
              </div>
              <span className={`jobs-badge${item.premium ? " is-premium" : ""}`}>{item.premium ? "Premium" : "Ativo"}</span>
            </div>
            <div className="jobs-card-meta">
              {[item.bairro, item.cidade].filter(Boolean).join(" | ") || "Base condominial"}
            </div>
            <p className="jobs-card-text">
              Operacao cadastrada na plataforma CondoJob para oportunidades, triagem e historico do setor condominial.
            </p>
            <div className="jobs-card-footer">
              <strong>{item.total_unidades ? `${item.total_unidades} unidades` : "Unidades sob consulta"}</strong>
              <span>Cadastro operacional CondoJob</span>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
