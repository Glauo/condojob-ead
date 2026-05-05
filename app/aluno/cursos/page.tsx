import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Matricula = { curso_id: string; nome: string; carga_horaria: number; status: string; total_aulas: number; concluidas: number; matriculado_em: string };

export default async function MeusCursosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const matriculas = await dbQuery<Matricula>(
    `SELECT m.curso_id, c.nome, c.carga_horaria, m.status, m.matriculado_em,
      (SELECT COUNT(*) FROM cj_aulas WHERE curso_id = m.curso_id) AS total_aulas,
      (SELECT COUNT(*) FROM cj_progresso p WHERE p.usuario_id = $1 AND p.concluido = true AND p.aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = m.curso_id)) AS concluidas
     FROM cj_matriculas m JOIN cj_cursos c ON c.id = m.curso_id
     WHERE m.usuario_id = $1 ORDER BY m.matriculado_em DESC`,
    [session.id]
  );

  return (
    <AppShell breadcrumb="Meus Cursos" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Formação</div>
          <h1 className="page-title">Meus Cursos</h1>
          <p className="page-desc">{matriculas.length} curso(s) matriculado(s).</p>
        </div>
      </div>

      {matriculas.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
              </div>
              <div className="empty-title">Nenhum curso ainda</div>
              <p className="empty-desc">Fale com seu coordenador para ser matriculado em um curso.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="course-grid">
          {matriculas.map((m) => {
            const total = Number(m.total_aulas) || 1;
            const conc = Number(m.concluidas) || 0;
            const pct = Math.round((conc / total) * 100);
            return (
              <a key={m.curso_id} href={`/aluno/curso/${m.curso_id}`} style={{ textDecoration: "none" }}>
                <div className="course-card">
                  <div className="course-card-thumb">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                  </div>
                  <div className="course-card-body">
                    <div className="course-card-num">
                      {m.carga_horaria}h · {m.status === "concluido" ? "Concluído" : "Em andamento"}
                    </div>
                    <div className="course-card-title">{m.nome}</div>
                    <div className="course-card-progress">
                      <div className="course-card-progress-label">
                        <span>Progresso</span>
                        <span style={{ color: m.status === "concluido" ? "var(--cj-success)" : "var(--cj-teal)" }}>{pct}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className={`progress-bar-fill ${m.status === "concluido" ? "progress-bar-fill-success" : ""}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "4px" }}>{conc} de {total} aulas concluídas</div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
