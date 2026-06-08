import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { CoordCursoManager } from "@/components/coord-curso-manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Curso = { id: string; nome: string; nota_minima: number };
type Material = { nome: string; url: string };
type AulaRaw = {
  id: string; titulo: string; ordem: number;
  video_url: string | null; conteudo: string | null;
  materiais: Material[]; total_atividades: number;
};
type Atividade = { id: string; aula_id: string; titulo: string; tipo: string; questoes: Array<{ texto: string; alternativas?: string[]; resposta_correta?: number }> };
type Submissao = {
  id: string; aula_titulo: string; atividade_titulo: string;
  aluno_nome: string; nota: number | null; status: string; submetido_em: string;
};

export default async function CoordAulasPage({
  searchParams,
}: {
  searchParams: Promise<{ curso?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const { curso: cursoParam } = await searchParams;

  const cursos = await dbQuery<Curso>(
    "SELECT id, nome, nota_minima FROM cj_cursos ORDER BY criado_em",
    []
  );

  if (cursos.length === 0) {
    return (
      <AppShell breadcrumb="Conteúdo" userName={session.nome} userRole="coordenador">
        <div className="page-header">
          <div>
            <div className="page-eyebrow"><span className="page-eyebrow-dot" />Conteúdo</div>
            <h1 className="page-title">Gerenciar Conteúdo</h1>
          </div>
          <a href="/coordenador/cursos" className="btn btn-primary">+ Criar primeiro curso</a>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-title">Nenhum curso criado ainda</div>
              <p className="empty-desc">Crie um curso primeiro para poder adicionar módulos, materiais e avaliações.</p>
              <a href="/coordenador/cursos" className="btn btn-primary" style={{ marginTop: "16px" }}>+ Criar curso</a>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const cursoId = cursoParam && cursos.find((c) => c.id === cursoParam)
    ? cursoParam
    : cursos[0].id;

  const curso = cursos.find((c) => c.id === cursoId)!;

  const [aulas, atividades, submissoes] = await Promise.all([
    dbQuery<AulaRaw>(
      `SELECT a.id, a.titulo, a.ordem, a.video_url, a.conteudo,
              COALESCE(a.materiais, '[]') AS materiais,
              COUNT(atv.id)::int AS total_atividades
       FROM cj_aulas a
       LEFT JOIN cj_atividades atv ON atv.aula_id = a.id
       WHERE a.curso_id = $1
       GROUP BY a.id ORDER BY a.ordem ASC, a.id ASC`,
      [cursoId]
    ),
    dbQuery<Atividade>(
      `SELECT id, aula_id, titulo, tipo, questoes FROM cj_atividades
       WHERE aula_id IN (SELECT id FROM cj_aulas WHERE curso_id = $1)
       ORDER BY (SELECT ordem FROM cj_aulas WHERE id = cj_atividades.aula_id),
                COALESCE(NULLIF(regexp_replace(titulo, '\\D', '', 'g'), '')::int, 9999),
                criado_em,
                id`,
      [cursoId]
    ),
    dbQuery<Submissao>(
      `SELECT s.id, s.nota, s.status, s.submetido_em::text AS submetido_em,
              u.nome AS aluno_nome, atv.titulo AS atividade_titulo, aula.titulo AS aula_titulo
       FROM cj_submissoes s
       JOIN cj_users u ON u.id = s.usuario_id
       JOIN cj_atividades atv ON atv.id = s.atividade_id
       JOIN cj_aulas aula ON aula.id = atv.aula_id
       WHERE atv.tipo IN ('dissertativa', 'upload')
         AND aula.curso_id = $1
         AND s.status IN ('aguardando_correcao', 'corrigida')
       ORDER BY s.submetido_em DESC`,
      [cursoId]
    ),
  ]);

  const pendentes = submissoes.filter((s) => s.status === "aguardando_correcao").length;
  const primeiraAulaApresentacao = /apresent/i.test(aulas[0]?.titulo ?? "");
  const totalModulos = primeiraAulaApresentacao ? Math.max(aulas.length - 1, 0) : aulas.length;

  return (
    <AppShell breadcrumb="Conteúdo" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Conteúdo</div>
          <h1 className="page-title">Gerenciar Conteúdo</h1>
          <p className="page-desc">
            Adicione módulos, vídeos, materiais PDF, avaliações e corrija atividades dos alunos.
          </p>
        </div>
        <div className="page-actions">
          <a href="/coordenador/cursos" className="btn btn-ghost btn-sm">Gerenciar cursos →</a>
        </div>
      </div>

      {/* Seletor de curso — visível só se tiver mais de 1 */}
      {cursos.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
          {cursos.map((c) => (
            <a
              key={c.id}
              href={`/coordenador/aulas?curso=${c.id}`}
              className={`btn btn-sm ${c.id === cursoId ? "btn-primary" : "btn-ghost"}`}
            >
              {c.nome}
              {c.id === cursoId && " ✓"}
            </a>
          ))}
        </div>
      )}

      {/* Info do curso selecionado */}
      <div style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "12px 16px",
        background: "var(--cj-dark-panel)",
        border: "1px solid var(--cj-dark-border)",
        borderRadius: "var(--cj-radius)",
        marginBottom: "4px",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--cj-purple-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ color: "var(--cj-purple-light)" }}>
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{curso.nome}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>
            {primeiraAulaApresentacao ? "1 apresentação · " : ""}
            {totalModulos} módulo{totalModulos !== 1 ? "s" : ""} ·{" "}
            {atividades.length} atividade{atividades.length !== 1 ? "s" : ""} ·{" "}
            Nota mínima: {Number(curso.nota_minima).toFixed(1)}
          </div>
        </div>
        {pendentes > 0 && (
          <span className="badge badge-warning">{pendentes} para corrigir</span>
        )}
      </div>

      <CoordCursoManager
        key={`${cursoId}-${aulas.map((a) => `${a.id}:${a.ordem}:${a.total_atividades}`).join("|")}-${atividades.length}`}
        cursoId={cursoId}
        notaMinima={Number(curso.nota_minima)}
        aulas={aulas}
        atividades={atividades}
        submissoes={submissoes}
      />
    </AppShell>
  );
}
