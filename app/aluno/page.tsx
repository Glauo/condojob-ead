import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Curso = { id: string; nome: string; carga_horaria: number };
type Progresso = { total_aulas: number; concluidas: number; curso_id: string };
type Nota = { nota: number };
type Notif = { id: string; mensagem: string; criado_em: string; lida: boolean };

export default async function AlunoDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const [matriculas, notas, notifs, proxPagamento] = await Promise.all([
    dbQuery<{ curso_id: string; nome: string; status: string; total_aulas: number; concluidas: number }>(
      `SELECT m.curso_id, c.nome, m.status,
        (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = m.curso_id) AS total_aulas,
        (SELECT COUNT(*) FROM cj_progresso p WHERE p.usuario_id = $1 AND p.concluido = true AND p.aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = m.curso_id)) AS concluidas
       FROM cj_matriculas m JOIN cj_cursos c ON c.id = m.curso_id
       WHERE m.usuario_id = $1 ORDER BY m.matriculado_em DESC`,
      [session.id]
    ),
    dbQuery<Nota>(
      `SELECT s.nota FROM cj_submissoes s WHERE s.usuario_id = $1 AND s.nota IS NOT NULL`,
      [session.id]
    ),
    dbQuery<Notif>(
      `SELECT id, mensagem, criado_em, lida FROM cj_notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 5`,
      [session.id]
    ),
    dbQueryOne<{ valor: number; vencimento: string }>(
      `SELECT valor, vencimento FROM cj_pagamentos WHERE usuario_id = $1 AND status = 'pendente' ORDER BY vencimento ASC LIMIT 1`,
      [session.id]
    ),
  ]);

  const mediaNotas = notas.length
    ? notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length
    : null;

  const cursosAtivos = matriculas.filter((m) => m.status === "ativo").length;
  const cursosConc = matriculas.filter((m) => m.status === "concluido").length;

  return (
    <AppShell breadcrumb="Dashboard" userName={session.nome} userRole="aluno" notifCount={notifs.filter((n) => !n.lida).length}>
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Bem-vindo</div>
          <h1 className="page-title">Olá, {session.nome.split(" ")[0]}!</h1>
          <p className="page-desc">Continue de onde parou. Sua jornada de formação condominial.</p>
        </div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-card-purple">
          <div className="metric-icon metric-icon-purple">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
          </div>
          <div className="metric-label">Cursos matriculados</div>
          <div className="metric-value">{matriculas.length}</div>
          <div className="metric-note">{cursosAtivos} em andamento</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-icon metric-icon-teal">
            <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>
          <div className="metric-label">Cursos concluídos</div>
          <div className="metric-value">{cursosConc}</div>
          <div className="metric-note">Certificados disponíveis</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-icon metric-icon-green">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
          </div>
          <div className="metric-label">Média geral</div>
          <div className="metric-value">{mediaNotas !== null ? mediaNotas.toFixed(1) : "—"}</div>
          <div className="metric-note">Em todas as atividades</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-icon metric-icon-yellow">
            <svg viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </div>
          <div className="metric-label">Próximo pagamento</div>
          <div className="metric-value">{proxPagamento ? `R$${Number(proxPagamento.valor).toFixed(2)}` : "—"}</div>
          <div className="metric-note">{proxPagamento ? `Vence em ${new Date(proxPagamento.vencimento).toLocaleDateString("pt-BR")}` : "Sem pendências"}</div>
        </div>
      </div>

      <div className="content-grid grid-2-1">
        {/* Cursos em andamento */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Minha formação</div>
              <h3 className="section-title">Cursos em andamento</h3>
            </div>
            <a href="/aluno/cursos" className="btn btn-ghost btn-sm">Ver todos</a>
          </div>
          <div className="card-body" style={{ paddingTop: "12px" }}>
            {matriculas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                </div>
                <div className="empty-title">Nenhum curso ainda</div>
                <p className="empty-desc">Entre em contato com seu coordenador para ser matriculado.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {matriculas.map((m) => {
                  const total = Number(m.total_aulas) || 1;
                  const conc = Number(m.concluidas) || 0;
                  const pct = Math.round((conc / total) * 100);
                  return (
                    <a key={m.curso_id} href={`/aluno/curso/${m.curso_id}`} style={{ textDecoration: "none" }}>
                      <div style={{ background: "var(--cj-dark)", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius)", padding: "16px", transition: "border-color 0.2s", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cj-purple)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cj-dark-border)")}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--cj-text)", fontSize: "0.9rem" }}>{m.nome}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>{conc} de {total} aulas concluídas</div>
                          </div>
                          <span className={`badge ${m.status === "concluido" ? "badge-success" : "badge-purple"}`}>
                            {m.status === "concluido" ? "Concluído" : "Em andamento"}
                          </span>
                        </div>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "4px", textAlign: "right" }}>{pct}%</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Notificações */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="section-eyebrow">Avisos</div>
                <h3 className="section-title">Notificações</h3>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: "8px" }}>
              {notifs.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>Nenhuma notificação.</p>
              ) : (
                <div className="notif-list">
                  {notifs.map((n) => (
                    <div className="notif-item" key={n.id}>
                      <div className={`notif-item-dot ${n.lida ? "read" : ""}`} />
                      <div className="notif-item-body">
                        <div className="notif-item-text">{n.mensagem}</div>
                        <div className="notif-item-time">
                          {new Date(n.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ background: "linear-gradient(135deg, var(--cj-dark-panel), var(--cj-dark-card))", border: "1px solid rgba(0,206,209,0.2)" }}>
            <div className="card-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>💬</div>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>Suporte via WhatsApp</div>
              <p style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)", marginBottom: "12px" }}>Dúvidas? Fale com seu coordenador direto no WhatsApp.</p>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ justifyContent: "center", width: "100%" }}>
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
