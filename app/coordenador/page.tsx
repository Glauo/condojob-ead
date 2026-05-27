import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ManualBackupButton } from "@/components/manual-backup-button";

export default async function CoordenadorDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const [stats, alunosRecentes, subsPendentes] = await Promise.all([
    dbQueryOne<{ total_alunos: number; total_cursos: number; total_concluidos: number; receita_mes: number }>(
      `SELECT
        (SELECT COUNT(*) FROM cj_users WHERE perfil = 'aluno') AS total_alunos,
        (SELECT COUNT(*) FROM cj_cursos) AS total_cursos,
        (SELECT COUNT(*) FROM cj_matriculas WHERE status = 'concluido') AS total_concluidos,
        (SELECT COALESCE(SUM(valor),0) FROM cj_pagamentos WHERE status = 'pago' AND date_trunc('month', pago_em) = date_trunc('month', now())) AS receita_mes`
    ),
    dbQuery<{ id: string; nome: string; email: string; criado_em: string }>(
      "SELECT id, nome, email, criado_em FROM cj_users WHERE perfil = 'aluno' ORDER BY criado_em DESC LIMIT 5"
    ),
    dbQuery<{ id: string; nome_aluno: string; titulo_atividade: string; submetido_em: string }>(
      `SELECT s.id, u.nome AS nome_aluno, at.titulo AS titulo_atividade, s.submetido_em
       FROM cj_submissoes s
       JOIN cj_users u ON u.id = s.usuario_id
       JOIN cj_atividades at ON at.id = s.atividade_id
       WHERE s.status = 'aguardando_correcao'
       ORDER BY s.submetido_em DESC LIMIT 5`
    ),
  ]);

  const s = stats ?? { total_alunos: 0, total_cursos: 0, total_concluidos: 0, receita_mes: 0 };

  return (
    <AppShell breadcrumb="Dashboard" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Gestão</div>
          <h1 className="page-title">Painel do Coordenador</h1>
          <p className="page-desc">Visão geral da plataforma CondoJob Educacional.</p>
        </div>
        <div className="page-actions">
          <ManualBackupButton />
          <a href="/coordenador/cursos" className="btn btn-primary">+ Novo Curso</a>
        </div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-card-purple">
          <div className="metric-icon metric-icon-purple">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
          </div>
          <div className="metric-label">Total de alunos</div>
          <div className="metric-value">{s.total_alunos}</div>
          <div className="metric-note">Matriculados na plataforma</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-icon metric-icon-teal">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
          </div>
          <div className="metric-label">Cursos ativos</div>
          <div className="metric-value">{s.total_cursos}</div>
          <div className="metric-note">Cursos na plataforma</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-icon metric-icon-green">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
          <div className="metric-label">Certificados emitidos</div>
          <div className="metric-value">{s.total_concluidos}</div>
          <div className="metric-note">Conclusões confirmadas</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-icon metric-icon-yellow">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </div>
          <div className="metric-label">Receita do mês</div>
          <div className="metric-value">R${Number(s.receita_mes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
          <div className="metric-note">Pagamentos confirmados</div>
        </div>
      </div>

      <div className="content-grid grid-2">
        {/* Alunos recentes */}
        <div className="card">
          <div className="card-header">
            <div><div className="section-eyebrow">Últimos cadastros</div><h3 className="section-title">Alunos recentes</h3></div>
            <a href="/coordenador/alunos" className="btn btn-ghost btn-sm">Ver todos</a>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {alunosRecentes.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>Nenhum aluno cadastrado ainda.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Aluno</th><th>Cadastrado em</th></tr></thead>
                <tbody>
                  {alunosRecentes.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{a.nome}</span>
                          <span className="table-name-secondary">{a.email}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>
                        {new Date(a.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pendentes de correção */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Aguardando</div>
              <h3 className="section-title">Atividades para corrigir</h3>
            </div>
            <a href="/coordenador/atividades" className="btn btn-ghost btn-sm">Ver todas</a>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {subsPendentes.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 0" }}>
                <span style={{ color: "var(--cj-success)", fontSize: "1.2rem" }}>✓</span>
                <span style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>Nenhuma atividade pendente de correção.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {subsPendentes.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--cj-dark)", borderRadius: "var(--cj-radius-sm)", border: "1px solid var(--cj-dark-border)" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--cj-text)" }}>{s.nome_aluno}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)" }}>{s.titulo_atividade}</div>
                    </div>
                    <span className="badge badge-warning">Pendente</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
