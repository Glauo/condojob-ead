import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun, dbQuery, dbQueryOne } from "@/lib/db";

type Atividade = { id: string; aula_id: string; tipo: string };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { atividade_ids, respostas, nota, aula_id } = await req.json();
  const ids = Array.isArray(atividade_ids) ? atividade_ids.filter(Boolean) : [];
  if (!aula_id || ids.length === 0) {
    return NextResponse.json({ error: "Aula e atividades sao obrigatorias." }, { status: 400 });
  }

  const progresso = await dbQueryOne<{ concluido: boolean }>(
    "SELECT concluido FROM cj_progresso WHERE usuario_id=$1 AND aula_id=$2",
    [session.id, aula_id]
  );
  if (!progresso?.concluido) {
    return NextResponse.json({ error: "Assista a aula completa antes de responder a avaliacao." }, { status: 403 });
  }

  const atividades = await dbQuery<Atividade>(
    "SELECT id, aula_id, tipo FROM cj_atividades WHERE id = ANY($1::uuid[])",
    [ids]
  );
  if (atividades.length !== ids.length || atividades.some((a) => a.aula_id !== aula_id)) {
    return NextResponse.json({ error: "Atividades invalidas para esta aula." }, { status: 400 });
  }

  for (const atividade of atividades) {
    const status = atividade.tipo === "dissertativa" || atividade.tipo === "upload"
      ? "aguardando_correcao"
      : "corrigida";
    const notaAtividade = status === "corrigida" ? nota ?? null : null;

    await dbRun(
      `INSERT INTO cj_submissoes (usuario_id, atividade_id, respostas, nota, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [session.id, atividade.id, JSON.stringify(respostas || {}), notaAtividade, status]
    );
  }

  if (nota !== null && nota !== undefined) {
    const curso = await dbQueryOne<{ nota_minima: number }>(
      "SELECT c.nota_minima FROM cj_cursos c JOIN cj_aulas a ON a.curso_id = c.id WHERE a.id=$1",
      [aula_id]
    );
    if (curso && Number(nota) >= Number(curso.nota_minima)) {
      await dbRun(
        `INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo)
         VALUES ($1, 'Otimo! Voce passou com nota ' || $2 || '. Proximo modulo desbloqueado!', 'sucesso')`,
        [session.id, Number(nota).toFixed(1)]
      );
    }
  }

  return NextResponse.json({ ok: true, nota });
}
