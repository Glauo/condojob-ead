import Link from "next/link";
import Image from "next/image";
import { initSchema, dbQueryOne, dbQuery } from "@/lib/db";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

type JobsSummary = {
  oportunidades: string;
  condominios: string;
  candidaturas: string;
};

type Opportunity = {
  id: string;
  titulo: string;
  condominio_nome: string;
  cidade: string | null;
  tipo_jornada: string;
  faixa_pagamento: string | null;
};

const ACCESS_CARDS = [
  {
    title: "Sou profissional",
    text: "Fazer login, ver vagas, aceitar trabalhos e acompanhar seu painel profissional.",
    href: "/profissionais/login",
    primary: true,
  },
  {
    title: "Sou empresa",
    text: "Cadastrar a empresa, publicar vagas e acompanhar quais trabalhadores aceitaram.",
    href: "/empresas/login",
    primary: false,
  },
  {
    title: "Administracao",
    text: "Visao geral de oportunidades, candidaturas e operacao da plataforma de empregos.",
    href: "/admin/oportunidades",
    primary: false,
  },
  {
    title: "CondoJob EAD",
    text: "Formacao profissional, certificacao e trilhas educacionais da CondoJob.",
    href: "/curso-assistente-condominial",
    primary: true,
  },
];

export async function JobsPlatformHome() {
  await initSchema();

  const [summary, opportunities] = await Promise.all([
    dbQueryOne<JobsSummary>(
      `SELECT
          (SELECT COUNT(*)::text FROM cj_job_opportunities WHERE ativo = true) AS oportunidades,
          (SELECT COUNT(*)::text FROM cj_job_condos WHERE ativo = true) AS condominios,
          (SELECT COUNT(*)::text FROM cj_job_applications) AS candidaturas`
    ),
    dbQuery<Opportunity>(
      `SELECT o.id, o.titulo, c.nome AS condominio_nome, c.cidade, o.tipo_jornada, o.faixa_pagamento
         FROM cj_job_opportunities o
         JOIN cj_job_condos c ON c.id = o.condo_id
        WHERE o.ativo = true
        ORDER BY o.criado_em DESC
        LIMIT 6`
    ),
  ]);

  return (
    <main className="jobs-home-page">
      <section className="jobs-home-hero">
        <nav className="jobs-home-nav" aria-label="Navegacao principal">
          <Link href="/" className="jobs-home-logo">
            <Image src={LOGO_URL} alt="CondoJob" width={170} height={52} priority />
          </Link>
          <div className="jobs-home-nav-actions">
            <Link href="/profissionais/oportunidades" className="jobs-home-nav-link">Ver vagas</Link>
            <Link href="/curso-assistente-condominial" className="jobs-home-nav-cta">CondoJob EAD</Link>
          </div>
        </nav>

        <div className="jobs-home-hero-grid">
          <div className="jobs-home-copy">
            <div className="jobs-home-eyebrow">CondoJob - Plataforma de empregos</div>
            <h1>Conecte profissionais, condominios e operacoes reais do setor condominial.</h1>
            <p>
              Esta e a plataforma principal de empregos da CondoJob. Aqui ficam as oportunidades, os condominios
              cadastrados, as candidaturas e o acesso operacional do ecossistema. O CondoJob EAD permanece separado
              como modulo de formacao.
            </p>
            <div className="jobs-home-metrics">
              <div>
                <strong>{summary?.oportunidades || "0"}</strong>
                <span>oportunidades ativas</span>
              </div>
              <div>
                <strong>{summary?.condominios || "0"}</strong>
                <span>condominios cadastrados</span>
              </div>
              <div>
                <strong>{summary?.candidaturas || "0"}</strong>
                <span>candidaturas registradas</span>
              </div>
            </div>
          </div>

          <div className="jobs-home-panel">
            <div className="jobs-home-panel-title">Acessos principais da plataforma</div>
            <div className="jobs-home-access-grid">
              {ACCESS_CARDS.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`jobs-home-access-card${card.primary ? " is-primary" : ""}`}
                >
                  <strong>{card.title}</strong>
                  <span>{card.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-home-section">
        <div className="jobs-home-section-copy">
          <span className="jobs-home-section-kicker">Oportunidades recentes</span>
          <h2>Entrada direta para trabalhador e empresa, com vagas reais e aceite pela plataforma.</h2>
          <p>
            Os principais caminhos agora abrem a plataforma de trabalho. O EAD fica disponivel somente como uma trilha
            complementar de formacao e certificacao.
          </p>
        </div>

        <div className="jobs-home-opportunities">
          {opportunities.map((item) => (
            <Link key={item.id} href="/profissionais/oportunidades" className="jobs-home-opportunity-card">
              <div className="jobs-home-opportunity-top">
                <strong>{item.titulo}</strong>
                <span>{item.tipo_jornada}</span>
              </div>
              <div className="jobs-home-opportunity-meta">
                {item.condominio_nome}
                {item.cidade ? ` | ${item.cidade}` : ""}
              </div>
              <div className="jobs-home-opportunity-salary">
                {item.faixa_pagamento || "Faixa salarial a combinar"}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
