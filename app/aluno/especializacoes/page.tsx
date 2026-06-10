import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { EspecializacaoButton } from "@/components/especializacao-button";

type Especializacao = {
  id: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number;
  preco: number;
  status: string | null;
  total_aulas: string;
  concluidas: string;
  total_materiais: string;
};

function stripHtml(value: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function EspecializacoesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const cursos = await dbQuery<Especializacao>(
    `SELECT c.id, c.nome, c.descricao, c.carga_horaria, c.preco,
            m.status,
            (SELECT COUNT(*) FROM cj_aulas a WHERE a.curso_id = c.id)::text AS total_aulas,
            (SELECT COUNT(*) FROM cj_progresso p
              WHERE p.usuario_id = $1
                AND p.concluido = true
                AND p.aula_id IN (SELECT id FROM cj_aulas a2 WHERE a2.curso_id = c.id))::text AS concluidas,
            (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(a.materiais, '[]'::jsonb))), 0)
               FROM cj_aulas a WHERE a.curso_id = c.id)::text AS total_materiais
       FROM cj_cursos c
       LEFT JOIN cj_matriculas m ON m.curso_id = c.id AND m.usuario_id = $1
      WHERE COALESCE(c.tipo, 'principal') = 'especializacao'
      ORDER BY c.criado_em ASC, c.nome ASC`,
    [session.id]
  );

  const matriculados = cursos.filter((curso) => curso.status).length;

  return (
    <AppShell breadcrumb="Especializacoes" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Cursos extras</div>
          <h1 className="page-title">Cursos de Especializacoes</h1>
          <p className="page-desc">Escolha novas formacoes e continue usando aulas, materiais, avaliacoes e certificados dentro da plataforma.</p>
        </div>
        <div className="page-actions">
          <a href="/aluno/cursos" className="btn btn-secondary">Meus cursos</a>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Especializacoes disponiveis</div>
          <div className="metric-value">{cursos.length}</div>
          <div className="metric-note">Cursos extras cadastrados</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Matriculas ativas</div>
          <div className="metric-value">{matriculados}</div>
          <div className="metric-note">Especializacoes em andamento</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Mesmo fluxo</div>
          <div className="metric-value">100%</div>
          <div className="metric-note">Aulas, materiais, notas e certificado</div>
        </div>
      </div>

      {cursos.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-title">Nenhuma especializacao disponivel</div>
              <p className="empty-desc">Quando o coordenador cadastrar cursos extras, eles aparecem aqui.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="course-grid">
          {cursos.map((curso) => {
            const total = Number(curso.total_aulas) || 1;
            const concluidas = Number(curso.concluidas) || 0;
            const progresso = Math.round((concluidas / total) * 100);
            const matriculado = Boolean(curso.status);
            return (
              <div key={curso.id} className="course-card">
                <div className="course-card-thumb">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 17a1 1 0 102 0v-1.586l.293.293a1 1 0 001.414-1.414L12 11.586l-2.707 2.707a1 1 0 101.414 1.414L11 15.414V17zM4 4a2 2 0 012-2h7a3 3 0 013 3v4a1 1 0 11-2 0V5a1 1 0 00-1-1H6v12h2a1 1 0 110 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                </div>
                <div className="course-card-body">
                  <div className="course-card-num">
                    {curso.carga_horaria}h | {curso.total_aulas} aula(s) | {curso.total_materiais} material(is)
                  </div>
                  <div className="course-card-title">{curso.nome}</div>
                  {curso.descricao && (
                    <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.84rem", marginTop: "8px" }}>
                      {stripHtml(curso.descricao).slice(0, 190)}
                    </p>
                  )}
                  {matriculado ? (
                    <div className="course-card-progress">
                      <div className="course-card-progress-label">
                        <span>Progresso</span>
                        <span style={{ color: curso.status === "concluido" ? "var(--cj-success)" : "var(--cj-teal)" }}>{progresso}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className={`progress-bar-fill ${curso.status === "concluido" ? "progress-bar-fill-success" : ""}`} style={{ width: `${progresso}%` }} />
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "4px" }}>{concluidas} de {total} aulas concluidas</div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <span className="badge badge-teal">{Number(curso.preco) > 0 ? `R$ ${Number(curso.preco).toFixed(2).replace(".", ",")}` : "Gratuito"}</span>
                      <span className="badge badge-muted">Certificado digital</span>
                    </div>
                  )}
                  <div className="specialization-card-actions">
                    {matriculado ? (
                      <a href={`/aluno/curso/${curso.id}`} className="btn btn-primary btn-sm">Abrir curso</a>
                    ) : (
                      <EspecializacaoButton cursoId={curso.id} preco={Number(curso.preco)} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
