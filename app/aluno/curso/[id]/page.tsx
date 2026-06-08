import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CourseAccordion } from "@/components/course-accordion";

type Curso = { id: string; nome: string; descricao: string; carga_horaria: number; nota_minima: number };
type Material = { nome: string; url: string };
type Aula = { id: string; titulo: string; ordem: number; video_url: string | null; materiais: string | Material[] };
type Prog = { aula_id: string; percentual: number; concluido: boolean };
type AtvStatus = { aula_id: string; total_atividades: string; atividades_aprovadas: string };
type AtvComSub = {
  id: string;
  aula_id: string;
  titulo: string;
  tipo: string;
  nota: number | null;
  sub_status: string | null;
};

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

  const [aulas, progressos, atvStatus, atividades] = await Promise.all([
    dbQuery<Aula>("SELECT id, titulo, ordem, video_url, materiais FROM cj_aulas WHERE curso_id = $1 ORDER BY ordem", [id]),
    dbQuery<Prog>(
      "SELECT aula_id, percentual, concluido FROM cj_progresso WHERE usuario_id = $1 AND aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = $2)",
      [session.id, id]
    ),
    dbQuery<AtvStatus>(
      `SELECT
         a.id AS aula_id,
         COUNT(DISTINCT atv.id)::text AS total_atividades,
         COUNT(DISTINCT atv.id) FILTER (
           WHERE s.usuario_id = $1 AND s.nota >= c.nota_minima AND s.status = 'corrigida'
         )::text AS atividades_aprovadas
       FROM cj_aulas a
       JOIN cj_cursos c ON c.id = a.curso_id
       LEFT JOIN cj_atividades atv ON atv.aula_id = a.id
       LEFT JOIN cj_submissoes s ON s.atividade_id = atv.id
       WHERE a.curso_id = $2
       GROUP BY a.id, c.nota_minima`,
      [session.id, id]
    ),
    // Melhor submissão por atividade (maior nota)
    dbQuery<AtvComSub>(
      `WITH melhores AS (
        SELECT atv.id, atv.aula_id, atv.titulo, atv.tipo,
               s.nota, s.status AS sub_status,
               a.ordem AS aula_ordem,
               COALESCE(NULLIF(regexp_replace(atv.titulo, '\\D', '', 'g'), '')::int, 9999) AS questao_ordem,
               ROW_NUMBER() OVER (PARTITION BY atv.id ORDER BY s.nota DESC NULLS LAST, s.submetido_em DESC NULLS LAST) AS rn
          FROM cj_atividades atv
          JOIN cj_aulas a ON a.id = atv.aula_id
          LEFT JOIN cj_submissoes s ON s.atividade_id = atv.id AND s.usuario_id = $1
         WHERE atv.aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = $2)
       )
       SELECT id, aula_id, titulo, tipo, nota, sub_status
         FROM melhores
        WHERE rn = 1
        ORDER BY aula_ordem ASC, questao_ordem ASC, titulo ASC, id ASC`,
      [session.id, id]
    ),
  ]);

  const progMap = Object.fromEntries(progressos.map((p) => [p.aula_id, p]));
  const atvMap = Object.fromEntries(atvStatus.map((a) => [a.aula_id, a]));
  const primeiraAulaApresentacao = /apresent/i.test(aulas[0]?.titulo ?? "");
  const primeiroModuloIndex = primeiraAulaApresentacao ? 1 : 0;
  const aulasAvaliativas = aulas.slice(primeiroModuloIndex);
  const totalConc = aulasAvaliativas.filter((a) => progMap[a.id]?.concluido).length;
  const pct = aulasAvaliativas.length ? Math.round((totalConc / aulasAvaliativas.length) * 100) : 0;

  function getUnlockInfo(idx: number): { unlocked: boolean; reason: string | null } {
    if (idx === 0) return { unlocked: true, reason: null };
    const prev = aulas[idx - 1];
    if (!progMap[prev.id]?.concluido) return { unlocked: false, reason: "Conclua o vídeo do módulo anterior" };
    const prevAtv = atvMap[prev.id];
    if (idx - 1 >= primeiroModuloIndex && prevAtv && Number(prevAtv.total_atividades) > 0 && Number(prevAtv.atividades_aprovadas) < Number(prevAtv.total_atividades)) {
      return { unlocked: false, reason: "Passe na atividade do módulo anterior (nota ≥ " + Number(curso!.nota_minima).toFixed(1) + ")" };
    }
    return { unlocked: true, reason: null };
  }

  const aulasComStatus = aulas.map((aula, idx) => {
    const prog = progMap[aula.id];
    const { unlocked, reason } = getUnlockInfo(idx);
    const materiais = Array.isArray(aula.materiais)
      ? aula.materiais
      : JSON.parse(aula.materiais || "[]") as Material[];
    return {
      id: aula.id,
      titulo: aula.titulo,
      ordem: aula.ordem,
      video_url: aula.video_url,
      materiais,
      percentual: prog?.percentual ?? 0,
      concluido: Boolean(prog?.concluido),
      unlocked,
      unlockReason: reason,
    };
  });

  return (
    <AppShell breadcrumb={curso.nome} userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Meu Curso</div>
          <h1 className="page-title">{curso.nome}</h1>
          {curso.descricao && <p className="page-desc">{curso.descricao}</p>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginBottom: "4px" }}>Progresso geral</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--cj-teal)", lineHeight: 1 }}>{pct}%</div>
          <div style={{ width: "80px", marginTop: "6px" }}>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Módulos avaliativos</div>
          <div className="metric-value">{aulasAvaliativas.length}</div>
          <div className="metric-note">{curso.carga_horaria}h de conteúdo</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Concluídos</div>
          <div className="metric-value">{totalConc}</div>
          <div className="metric-note">de {aulasAvaliativas.length} módulos avaliativos</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Nota mínima</div>
          <div className="metric-value">{Number(curso.nota_minima).toFixed(1)}</div>
          <div className="metric-note">Para avançar nos módulos</div>
        </div>
      </div>

      <CourseAccordion
        aulas={aulasComStatus}
        atividades={primeiraAulaApresentacao ? atividades.filter((a) => a.aula_id !== aulas[0]?.id) : atividades}
        notaMinima={Number(curso.nota_minima)}
      />
    </AppShell>
  );
}
