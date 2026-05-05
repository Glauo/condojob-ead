import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Curso = { id: string; nome: string; descricao: string; carga_horaria: number; nota_minima: number };
type Aula = { id: string; titulo: string; ordem: number };
type Prog = { aula_id: string; percentual: number; concluido: boolean };

export default async function CursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  const [curso, matricula] = await Promise.all([
    dbQueryOne<Curso>("SELECT id, nome, descricao, carga_horaria, nota_minima FROM cj_cursos WHERE id = $1", [id]),
    dbQueryOne("SELECT id, status FROM cj_matriculas WHERE usuario_id = $1 AND curso_id = $2", [session.id, id]),
  ]);

  if (!curso || !matricula) notFound();

  const [aulas, progressos] = await Promise.all([
    dbQuery<Aula>("SELECT id, titulo, ordem FROM cj_aulas WHERE curso_id = $1 ORDER BY ordem", [id]),
    dbQuery<Prog>("SELECT aula_id, percentual, concluido FROM cj_progresso WHERE usuario_id = $1 AND aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = $2)", [session.id, id]),
  ]);

  const progMap = Object.fromEntries(progressos.map((p) => [p.aula_id, p]));
  const totalConc = progressos.filter((p) => p.concluido).length;
  const pct = aulas.length ? Math.round((totalConc / aulas.length) * 100) : 0;

  function isUnlocked(idx: number): boolean {
    if (idx === 0) return true;
    const prev = aulas[idx - 1];
    return Boolean(progMap[prev.id]?.concluido);
  }

  return (
    <AppShell breadcrumb={curso.nome} userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Meu Curso</div>
          <h1 className="page-title">{curso.nome}</h1>
          {curso.descricao && <p className="page-desc">{curso.descricao}</p>}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)" }}>Progresso</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--cj-teal)" }}>{pct}%</div>
          </div>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total de aulas</div>
          <div className="metric-value">{aulas.length}</div>
          <div className="metric-note">{curso.carga_horaria}h de conteúdo</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Concluídas</div>
          <div className="metric-value">{totalConc}</div>
          <div className="metric-note">de {aulas.length} aulas</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Nota mínima</div>
          <div className="metric-value">{Number(curso.nota_minima).toFixed(1)}</div>
          <div className="metric-note">Para avançar entre aulas</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Conteúdo</div>
            <h3 className="section-title">Aulas do curso</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "12px" }}>
          {aulas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhuma aula cadastrada</div>
              <p className="empty-desc">As aulas serão disponibilizadas em breve pelo coordenador.</p>
            </div>
          ) : (
            <div className="step-list">
              {aulas.map((aula, idx) => {
                const prog = progMap[aula.id];
                const unlocked = isUnlocked(idx);
                const done = Boolean(prog?.concluido);
                const pctAula = prog?.percentual ?? 0;
                return (
                  <div className="step-item" key={aula.id}>
                    <div className={`step-num ${done ? "done" : unlocked ? "active" : ""}`}>
                      {done ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : String(aula.ordem).padStart(2, "0")}
                    </div>
                    <div className="step-body">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div>
                          <div className="step-title" style={{ color: !unlocked ? "var(--cj-text-muted)" : undefined }}>
                            {aula.titulo}
                            {!unlocked && (
                              <span style={{ marginLeft: "8px", fontSize: "0.72rem", color: "var(--cj-text-muted)" }}>🔒 Bloqueada</span>
                            )}
                          </div>
                          {unlocked && !done && pctAula > 0 && (
                            <div style={{ marginTop: "4px", maxWidth: "200px" }}>
                              <div className="progress-bar-wrap" style={{ height: "4px" }}>
                                <div className="progress-bar-fill progress-bar-fill-teal" style={{ width: `${pctAula}%` }} />
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>{pctAula}% assistido</div>
                            </div>
                          )}
                        </div>
                        {unlocked && (
                          <a href={`/aluno/aula/${aula.id}`} className="btn btn-primary btn-sm">
                            {done ? "Rever" : "Entrar"}
                          </a>
                        )}
                        {!unlocked && <span className="badge badge-muted">Bloqueada</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
