import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbQuery } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { PlayerClient } from "@/components/player-client";

type Material = { nome: string; url: string };
type Questao = { texto: string; alternativas?: string[]; resposta_correta?: number };
type Aula = { id: string; titulo: string; ordem: number; video_url: string | null; conteudo: string | null; materiais: string | Material[] | null; curso_id: string; curso_nome: string; nota_minima: number };
type AulaOrdem = { id: string; titulo: string; ordem: number };
type Atividade = { id: string; titulo: string; tipo: string; questoes: string | Questao[] | null };
type Prog = { percentual: number; concluido: boolean };

function parseArray<T>(value: string | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function displayModulo(aulas: AulaOrdem[], aulaId: string) {
  const idx = aulas.findIndex((aula) => aula.id === aulaId);
  const primeiraAulaApresentacao = /apresent/i.test(aulas[0]?.titulo ?? "");
  if (primeiraAulaApresentacao && idx === 0) return "AP";
  return String(primeiraAulaApresentacao ? idx : idx + 1).padStart(2, "0");
}

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  const aula = await dbQueryOne<Aula>(
    `SELECT a.id, a.titulo, a.ordem, a.video_url, a.conteudo, a.materiais, a.curso_id,
            c.nome AS curso_nome, c.nota_minima
     FROM cj_aulas a JOIN cj_cursos c ON c.id = a.curso_id WHERE a.id = $1`,
    [id]
  );
  if (!aula) notFound();

  const matricula = await dbQueryOne(
    "SELECT id FROM cj_matriculas WHERE usuario_id = $1 AND curso_id = $2",
    [session.id, aula.curso_id]
  );
  if (!matricula) redirect(`/aluno/curso/${aula.curso_id}`);

  const [progresso, atividades, aulasCurso] = await Promise.all([
    dbQueryOne<Prog>("SELECT percentual, concluido FROM cj_progresso WHERE usuario_id = $1 AND aula_id = $2", [session.id, id]),
    dbQuery<Atividade>(
      `SELECT id, titulo, tipo, questoes
         FROM cj_atividades
        WHERE aula_id = $1
        ORDER BY COALESCE(NULLIF(regexp_replace(titulo, '\\D', '', 'g'), '')::int, 9999),
                 criado_em ASC,
                 id ASC`,
      [id]
    ),
    dbQuery<AulaOrdem>("SELECT id, titulo, ordem FROM cj_aulas WHERE curso_id = $1 ORDER BY ordem", [aula.curso_id]),
  ]);

  const materiais = parseArray<Material>(aula.materiais);
  const moduloLabel = displayModulo(aulasCurso, aula.id);

  return (
    <AppShell breadcrumb={aula.titulo} userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">
            <span className="page-eyebrow-dot" />
            {aula.curso_nome} — {moduloLabel === "AP" ? "Apresentação" : `Módulo ${moduloLabel}`}
          </div>
          <h1 className="page-title">{aula.titulo}</h1>
        </div>
        <a href={`/aluno/curso/${aula.curso_id}`} className="btn btn-ghost btn-sm">
          ← Voltar ao curso
        </a>
      </div>

      <PlayerClient
        aulaId={aula.id}
        cursoId={aula.curso_id}
        videoUrl={aula.video_url}
        conteudo={aula.conteudo}
        materiais={materiais}
        progressoInicial={progresso?.percentual ?? 0}
        jaConcluido={progresso?.concluido ?? false}
        atividades={atividades.map((a) => ({
          ...a,
          questoes: parseArray<Questao>(a.questoes),
        }))}
        notaMinima={Number(aula.nota_minima)}
        userId={session.id}
      />
    </AppShell>
  );
}
