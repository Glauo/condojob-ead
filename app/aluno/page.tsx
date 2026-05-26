import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";

type Matricula = {
  curso_id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  status: string;
  total_aulas: string;
  concluidas: string;
  total_materiais: string;
};

type AulaConteudo = {
  id: string;
  curso_id: string;
  curso_nome: string;
  titulo: string;
  ordem: number;
  conteudo: string | null;
  video_url: string | null;
  materiais: string;
  concluido: boolean;
  percentual: number;
  total_atividades: number;
  submissoes_avaliacao: number;
  nota_avaliacao: string | null;
};

type CursoExtra = {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  total_aulas: string;
};

type Nota = {
  id: string;
  nota: number | null;
  status: string;
  atividade: string;
  aula: string;
  curso: string;
  submetido_em: string;
};

type Cert = {
  id: string;
  codigo: string;
  emitido_em: string;
  nome_curso: string;
  carga_horaria: number;
};

type Notif = { id: string; mensagem: string; criado_em: string; lida: boolean };

function stripHtml(value: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseMateriais(raw: string) {
  try {
    return JSON.parse(raw || "[]") as { nome: string; url: string }[];
  } catch {
    return [];
  }
}

function displayModulo(aulas: AulaConteudo[], aula: AulaConteudo) {
  const aulasCurso = aulas.filter((item) => item.curso_id === aula.curso_id).sort((a, b) => a.ordem - b.ordem);
  const idx = aulasCurso.findIndex((item) => item.id === aula.id);
  const primeiraAulaApresentacao = /apresent/i.test(aulasCurso[0]?.titulo ?? "");
  if (primeiraAulaApresentacao && idx === 0) return "AP";
  return String(primeiraAulaApresentacao ? idx : idx + 1).padStart(2, "0");
}

export default async function AlunoDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const [matriculas, aulas, cursosExtras, notas, certs, notifs, proxPagamento, chatMessages] = await Promise.all([
    dbQuery<Matricula>(
      `SELECT m.curso_id, c.nome, c.descricao, c.carga_horaria, m.status,
              (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = m.curso_id)::text AS total_aulas,
              (SELECT COUNT(*) FROM cj_progresso p
                WHERE p.usuario_id = $1 AND p.concluido = true
                  AND p.aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = m.curso_id))::text AS concluidas,
              (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(a.materiais, '[]'::jsonb))), 0)
                 FROM cj_aulas a WHERE a.curso_id = m.curso_id)::text AS total_materiais
         FROM cj_matriculas m
         JOIN cj_cursos c ON c.id = m.curso_id
        WHERE m.usuario_id = $1
        ORDER BY m.matriculado_em DESC`,
      [session.id]
    ),
    dbQuery<AulaConteudo>(
      `SELECT a.id, a.curso_id, c.nome AS curso_nome, a.titulo, a.ordem,
              a.conteudo, a.video_url, a.materiais,
              COALESCE(p.concluido, false) AS concluido,
              COALESCE(p.percentual, 0) AS percentual,
              (SELECT COUNT(*)::int FROM cj_atividades atv WHERE atv.aula_id = a.id) AS total_atividades,
              (SELECT COUNT(*)::int
                 FROM cj_submissoes s
                 JOIN cj_atividades atv ON atv.id = s.atividade_id
                WHERE atv.aula_id = a.id AND s.usuario_id = $1) AS submissoes_avaliacao,
              (SELECT MAX(s.nota)::text
                 FROM cj_submissoes s
                 JOIN cj_atividades atv ON atv.id = s.atividade_id
                WHERE atv.aula_id = a.id AND s.usuario_id = $1) AS nota_avaliacao
         FROM cj_matriculas m
         JOIN cj_cursos c ON c.id = m.curso_id
         JOIN cj_aulas a ON a.curso_id = c.id
         LEFT JOIN cj_progresso p ON p.aula_id = a.id AND p.usuario_id = $1
        WHERE m.usuario_id = $1
        ORDER BY c.nome, a.ordem`,
      [session.id]
    ),
    dbQuery<CursoExtra>(
      `SELECT c.id, c.nome, c.descricao, c.carga_horaria,
              (SELECT COUNT(*) FROM cj_aulas a WHERE a.curso_id = c.id)::text AS total_aulas
         FROM cj_cursos c
        WHERE NOT EXISTS (
          SELECT 1 FROM cj_matriculas m WHERE m.curso_id = c.id AND m.usuario_id = $1
        )
        ORDER BY c.criado_em DESC
        LIMIT 6`,
      [session.id]
    ),
    dbQuery<Nota>(
      `SELECT s.id, s.nota, s.status, s.submetido_em,
              at.titulo AS atividade, a.titulo AS aula, c.nome AS curso
         FROM cj_submissoes s
         JOIN cj_atividades at ON at.id = s.atividade_id
         JOIN cj_aulas a ON a.id = at.aula_id
         JOIN cj_cursos c ON c.id = a.curso_id
        WHERE s.usuario_id = $1
        ORDER BY s.submetido_em DESC
        LIMIT 10`,
      [session.id]
    ),
    dbQuery<Cert>(
      `SELECT ce.id, ce.codigo, ce.emitido_em, c.nome AS nome_curso, c.carga_horaria
         FROM cj_certificados ce
         JOIN cj_cursos c ON c.id = ce.curso_id
        WHERE ce.usuario_id = $1
        ORDER BY ce.emitido_em DESC
        LIMIT 4`,
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
    dbQuery<ChatMessage>(
      `SELECT cm.id, cm.aluno_id, cm.coordenador_id, cm.remetente_id,
              u.nome AS remetente_nome, u.perfil AS remetente_perfil,
              cm.mensagem, cm.lida, cm.criado_em
         FROM cj_chat_mensagens cm
         JOIN cj_users u ON u.id = cm.remetente_id
        WHERE cm.aluno_id = $1
        ORDER BY cm.criado_em DESC
        LIMIT 40`,
      [session.id]
    ),
  ]);

  const mediaNotas = notas.filter((n) => n.nota !== null).length
    ? notas.filter((n) => n.nota !== null).reduce((s, n) => s + Number(n.nota), 0) / notas.filter((n) => n.nota !== null).length
    : null;
  const cursosAtivos = matriculas.filter((m) => m.status === "ativo").length;
  const cursosConc = matriculas.filter((m) => m.status === "concluido").length;
  const totalConteudos = aulas.length;
  const totalMateriais = matriculas.reduce((sum, m) => sum + Number(m.total_materiais || 0), 0);

  return (
    <AppShell breadcrumb="Painel do Aluno" userName={session.nome} userRole="aluno" notifCount={notifs.filter((n) => !n.lida).length}>
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Area do aluno</div>
          <h1 className="page-title">Ola, {session.nome.split(" ")[0]}!</h1>
          <p className="page-desc">Acompanhe seus cursos, conteudos, notas, certificados e atendimento em um so lugar.</p>
        </div>
        <div className="page-actions">
          <a href="/aluno/cursos" className="btn btn-primary">Meus cursos</a>
          <a href="/aluno/certificados" className="btn btn-secondary">Certificados</a>
        </div>
      </div>

      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Cursos matriculados</div>
          <div className="metric-value">{matriculas.length}</div>
          <div className="metric-note">{cursosAtivos} em andamento</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Conteudos do curso</div>
          <div className="metric-value">{totalConteudos}</div>
          <div className="metric-note">{totalMateriais} material(is) de apoio</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Media geral</div>
          <div className="metric-value">{mediaNotas !== null ? mediaNotas.toFixed(1) : "--"}</div>
          <div className="metric-note">Notas corrigidas</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Proximo pagamento</div>
          <div className="metric-value">{proxPagamento ? `R$${Number(proxPagamento.valor).toFixed(2)}` : "--"}</div>
          <div className="metric-note">{proxPagamento ? `Vence em ${new Date(proxPagamento.vencimento).toLocaleDateString("pt-BR")}` : "Sem pendencias"}</div>
        </div>
      </div>

      <div className="content-grid grid-2-1">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Informacoes do curso</div>
              <h3 className="section-title">Cursos em andamento</h3>
            </div>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {matriculas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-title">Nenhum curso ainda</div>
                <p className="empty-desc">Fale com seu coordenador para ser matriculado.</p>
              </div>
            ) : (
              matriculas.map((m) => {
                const total = Number(m.total_aulas) || 1;
                const conc = Number(m.concluidas) || 0;
                const pct = Math.round((conc / total) * 100);
                return (
                  <a key={m.curso_id} href={`/aluno/curso/${m.curso_id}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "var(--cj-dark)", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius)", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--cj-text)" }}>{m.nome}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--cj-text-muted)", marginTop: "3px" }}>
                            {m.carga_horaria}h | {total} aula(s) | {m.total_materiais} material(is)
                          </div>
                        </div>
                        <span className={`badge ${m.status === "concluido" ? "badge-success" : "badge-purple"}`}>
                          {m.status === "concluido" ? "Concluido" : "Em andamento"}
                        </span>
                      </div>
                      {m.descricao && (
                        <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.84rem", marginBottom: "10px" }}>
                          {stripHtml(m.descricao).slice(0, 180)}
                        </p>
                      )}
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "4px", textAlign: "right" }}>
                        {conc} de {total} conteudos concluidos | {pct}%
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>

        <ChatPanel initialMessages={chatMessages.reverse()} currentUserId={session.id} alunoId={session.id} />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Conteudo do curso</div>
            <h3 className="section-title">Aulas, modulos e materiais</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "8px" }}>
          {aulas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum conteudo liberado</div>
              <p className="empty-desc">Assim que o curso for configurado, os modulos aparecem aqui.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {aulas.map((aula) => {
                const materiais = parseMateriais(aula.materiais);
                const resumo = stripHtml(aula.conteudo);
                const totalAtividades = Number(aula.total_atividades || 0);
                const submissoesAvaliacao = Number(aula.submissoes_avaliacao || 0);
                const notaAvaliacao = aula.nota_avaliacao !== null ? Number(aula.nota_avaliacao) : null;
                const avaliacaoEnviada = totalAtividades > 0 && submissoesAvaliacao >= totalAtividades;
                const avaliacaoDisponivel = totalAtividades > 0 && aula.concluido;
                return (
                  <div key={aula.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "12px", alignItems: "start", padding: "12px", background: "var(--cj-dark)", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius)" }}>
                    <div className={`accordion-item-num${aula.concluido ? " done" : " active"}`}>
                      {displayModulo(aulas, aula)}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.76rem", color: "var(--cj-teal)", fontWeight: 700 }}>{aula.curso_nome}</div>
                      <div style={{ fontWeight: 700, color: "var(--cj-text)" }}>{aula.titulo}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--cj-text-muted)", marginTop: "3px" }}>
                        {aula.video_url ? "Video disponivel" : "Sem video"} | {materiais.length} material(is) | {aula.concluido ? "Concluido" : `${aula.percentual}% assistido`}
                      </div>
                      {totalAtividades > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px", alignItems: "center" }}>
                          <span className={`badge ${
                            avaliacaoEnviada ? "badge-success" :
                            avaliacaoDisponivel ? "badge-teal" :
                            "badge-muted"
                          }`}>
                            Avaliacao: {totalAtividades} questoes
                          </span>
                          {avaliacaoEnviada ? (
                            <span className="badge badge-success">
                              Enviada{notaAvaliacao !== null ? ` | Nota ${notaAvaliacao.toFixed(1)}` : ""}
                            </span>
                          ) : avaliacaoDisponivel ? (
                            <span className="badge badge-teal">Disponivel apos video concluido</span>
                          ) : (
                            <span className="badge badge-muted">Bloqueada ate concluir o video</span>
                          )}
                        </div>
                      )}
                      {resumo && (
                        <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.82rem", marginTop: "7px" }}>
                          {resumo.slice(0, 220)}
                        </p>
                      )}
                      {materiais.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                          {materiais.slice(0, 3).map((m, i) => (
                            <a key={`${aula.id}-${i}`} href={m.url} target="_blank" rel="noopener noreferrer" className="badge badge-muted">
                              {m.nome}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <a href={`/aluno/aula/${aula.id}`} className="btn btn-primary btn-sm">
                      Abrir
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="content-grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Biblioteca</div>
              <h3 className="section-title">Cursos extras</h3>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: "10px" }}>
            {cursosExtras.length === 0 ? (
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>Nenhum curso extra disponivel no momento.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {cursosExtras.map((curso) => (
                  <div key={curso.id} style={{ padding: "12px", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius)", background: "var(--cj-dark)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{curso.nome}</div>
                        <div style={{ fontSize: "0.76rem", color: "var(--cj-text-muted)" }}>
                          {curso.carga_horaria}h | {curso.total_aulas} aula(s)
                        </div>
                      </div>
                      <span className="badge badge-teal">Extra</span>
                    </div>
                    {curso.descricao && (
                      <p style={{ fontSize: "0.82rem", color: "var(--cj-text-secondary)", marginTop: "8px" }}>
                        {stripHtml(curso.descricao).slice(0, 150)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Desempenho</div>
              <h3 className="section-title">Notas recentes</h3>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {notas.length === 0 ? (
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>Nenhuma avaliacao enviada ainda.</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Atividade</th><th>Status</th><th>Nota</th></tr></thead>
                <tbody>
                  {notas.map((n) => (
                    <tr key={n.id}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-primary">{n.atividade}</span>
                          <span className="table-name-secondary">{n.curso} | {n.aula}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${n.status === "corrigida" ? "badge-success" : "badge-warning"}`}>{n.status === "corrigida" ? "Corrigida" : "Aguardando"}</span></td>
                      <td style={{ fontWeight: 800 }}>{n.nota !== null ? Number(n.nota).toFixed(1) : "--"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="content-grid grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Certificados</div>
              <h3 className="section-title">Minhas conquistas</h3>
            </div>
            <a href="/aluno/certificados" className="btn btn-ghost btn-sm">Ver todos</a>
          </div>
          <div className="card-body" style={{ paddingTop: "10px" }}>
            {certs.length === 0 ? (
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>Complete um curso para liberar o certificado.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {certs.map((cert) => (
                  <a key={cert.id} href={`/certificado/${cert.codigo}`} target="_blank" className="accordion-material-item">
                    <span style={{ flex: 1 }}>
                      <strong>{cert.nome_curso}</strong><br />
                      <span style={{ color: "var(--cj-text-muted)", fontSize: "0.76rem" }}>{cert.carga_horaria}h | {new Date(cert.emitido_em).toLocaleDateString("pt-BR")}</span>
                    </span>
                    <span className="badge badge-success">Emitido</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="section-eyebrow">Avisos</div>
              <h3 className="section-title">Notificacoes</h3>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: "8px" }}>
            {notifs.length === 0 ? (
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>Nenhuma notificacao.</p>
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
      </div>
    </AppShell>
  );
}
