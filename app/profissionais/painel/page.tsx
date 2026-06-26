import { redirect } from "next/navigation";
import Link from "next/link";
import { getJobSession } from "@/lib/job-auth";
import { initSchema, dbQuery } from "@/lib/db";

type JobRow = {
  id: string;
  titulo: string;
  nome: string;
  cidade: string | null;
  bairro: string | null;
  faixa_pagamento: string | null;
  disponibilidade: string | null;
  status: string;
  data_servico: string | null;
  hora_servico: string | null;
};

export default async function ProfissionaisPainelPage() {
  await initSchema();
  const session = await getJobSession();
  if (!session || session.perfil !== "worker") redirect("/profissionais/login");

  const jobs = await dbQuery<JobRow>(
    `SELECT o.id, o.titulo, c.nome, c.cidade, c.bairro, o.faixa_pagamento, o.disponibilidade,
            o.status, o.data_servico::text, o.hora_servico::text
       FROM cj_job_opportunities o
       JOIN cj_job_condos c ON c.id = o.condo_id
      WHERE o.worker_id = $1
      ORDER BY COALESCE(o.aceito_em, o.criado_em) DESC`,
    [session.id]
  );

  return (
    <main className="jobs-page-wrap">
      <div className="jobs-page-header">
        <div>
          <div className="jobs-page-eyebrow">Painel do trabalhador</div>
          <h1 className="jobs-page-title">Trabalhos aceitos</h1>
          <p className="jobs-page-desc">Acompanhe as vagas que voce aceitou e abra novas oportunidades quando houver disponibilidade.</p>
        </div>
        <div className="jobs-page-actions">
          <Link href="/profissionais/oportunidades" className="jobs-btn jobs-btn-primary">Buscar vagas</Link>
        </div>
      </div>

      <div className="jobs-summary-grid">
        <div className="jobs-summary-card"><strong>{jobs.length}</strong><span>Trabalhos no painel</span></div>
        <div className="jobs-summary-card"><strong>{jobs.filter((job) => job.status === "aceita").length}</strong><span>Em andamento</span></div>
        <div className="jobs-summary-card"><strong>{session.nome}</strong><span>Perfil ativo</span></div>
      </div>

      <div className="jobs-list-grid">
        {jobs.map((job) => (
          <article key={job.id} className="jobs-card">
            <div className="jobs-card-top">
              <div>
                <div className="jobs-card-title">{job.titulo}</div>
                <div className="jobs-card-subtitle">{job.nome}</div>
              </div>
              <span className="jobs-badge">{job.status}</span>
            </div>
            <div className="jobs-card-meta">{[job.bairro, job.cidade].filter(Boolean).join(" | ")}</div>
            <p className="jobs-card-text">{job.disponibilidade || "Detalhes operacionais informados pela empresa."}</p>
            <div className="jobs-card-footer">
              <strong>{job.faixa_pagamento || "Pagamento a combinar"}</strong>
              <span>{[job.data_servico, job.hora_servico].filter(Boolean).join(" | ") || "Data sob alinhamento"}</span>
            </div>
          </article>
        ))}
        {!jobs.length && (
          <article className="jobs-card jobs-empty-card">
            <div className="jobs-card-title">Nenhum trabalho aceito ainda</div>
            <p className="jobs-card-text">Abra a lista de oportunidades e aceite uma vaga disponivel para ela aparecer aqui.</p>
          </article>
        )}
      </div>
    </main>
  );
}
