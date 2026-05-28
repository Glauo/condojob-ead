import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type MaterialRow = {
  aula_id: string;
  aula_titulo: string;
  ordem: number;
  curso_nome: string;
  material_nome: string;
  material_url: string;
};

export const dynamic = "force-dynamic";

function moduloLabel(ordem: number, titulo: string) {
  if (/apresent/i.test(titulo)) return "Apresentacao";
  return `Modulo ${String(Math.max(ordem - 1, 1)).padStart(2, "0")}`;
}

export default async function BibliotecaAlunoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const materiais = await dbQuery<MaterialRow>(
    `SELECT a.id AS aula_id,
            a.titulo AS aula_titulo,
            a.ordem,
            c.nome AS curso_nome,
            material->>'nome' AS material_nome,
            material->>'url' AS material_url
       FROM cj_matriculas m
       JOIN cj_cursos c ON c.id = m.curso_id
       JOIN cj_aulas a ON a.curso_id = c.id
       CROSS JOIN LATERAL jsonb_array_elements(COALESCE(a.materiais, '[]'::jsonb)) AS material
      WHERE m.usuario_id = $1
        AND COALESCE(material->>'url', '') <> ''
      ORDER BY c.nome, a.ordem, material->>'nome'`,
    [session.id]
  );

  return (
    <AppShell breadcrumb="Biblioteca" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Materiais do curso</div>
          <h1 className="page-title">Biblioteca de downloads</h1>
          <p className="page-desc">Acesse as apostilas e materiais de apoio dos cursos em que voce esta matriculado.</p>
        </div>
        <div className="page-actions">
          <a href="/aluno/cursos" className="btn btn-secondary">Meus cursos</a>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Arquivos disponiveis</div>
            <h3 className="section-title">{materiais.length} material(is) para download</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "10px" }}>
          {materiais.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum material disponivel</div>
              <p className="empty-desc">Quando o coordenador anexar PDFs ao curso, eles aparecem aqui.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {materiais.map((m) => (
                <a
                  key={`${m.aula_id}-${m.material_url}`}
                  href={m.material_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="accordion-material-item"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ color: "var(--cj-danger)", flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong>{m.material_nome || "Material de apoio"}</strong><br />
                    <span style={{ color: "var(--cj-text-muted)", fontSize: "0.76rem" }}>
                      {m.curso_nome} | {moduloLabel(Number(m.ordem), m.aula_titulo)} | {m.aula_titulo}
                    </span>
                  </span>
                  <span className="badge badge-teal">Baixar PDF</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
