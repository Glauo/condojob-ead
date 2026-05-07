import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AulasManager } from "@/components/aulas-manager";

type Curso = { id: string; nome: string };
type Aula = { id: string; titulo: string; ordem: number; video_url: string | null; curso_id: string; curso_nome: string };

export default async function CoordAulasPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const [cursos, aulas] = await Promise.all([
    dbQuery<Curso>("SELECT id, nome FROM cj_cursos ORDER BY criado_em", []),
    dbQuery<Aula>(
      `SELECT a.id, a.titulo, a.ordem, a.video_url, a.curso_id, c.nome AS curso_nome
       FROM cj_aulas a JOIN cj_cursos c ON c.id = a.curso_id
       ORDER BY c.nome, a.ordem`,
      []
    ),
  ]);

  return (
    <AppShell breadcrumb="Aulas" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Conteúdo</div>
          <h1 className="page-title">Videoteca de Aulas</h1>
          <p className="page-desc">Gerencie as aulas e vincule os vídeos de cada módulo.</p>
        </div>
      </div>
      <AulasManager cursos={cursos} aulasIniciais={aulas} />
    </AppShell>
  );
}
