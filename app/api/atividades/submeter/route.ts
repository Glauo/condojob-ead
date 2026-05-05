import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun, dbQueryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { atividade_ids, respostas, nota, aula_id } = await req.json();

  for (const atv_id of (atividade_ids as string[])) {
    const atividade = await dbQueryOne<{ tipo: string }>("SELECT tipo FROM cj_atividades WHERE id=$1", [atv_id]);
    const status = atividade?.tipo === "dissertativa" || atividade?.tipo === "upload"
      ? "aguardando_correcao" : "corrigida";
    await dbRun(
      `INSERT INTO cj_submissoes (usuario_id, atividade_id, respostas, nota, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [session.id, atv_id, JSON.stringify(respostas || {}), nota ?? null, status]
    );
  }

  if (nota !== null && nota !== undefined && aula_id) {
    const curso = await dbQueryOne<{ nota_minima: number }>(
      "SELECT c.nota_minima FROM cj_cursos c JOIN cj_aulas a ON a.curso_id = c.id WHERE a.id=$1",
      [aula_id]
    );
    if (curso && Number(nota) >= Number(curso.nota_minima)) {
      await dbRun(
        `INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo)
         VALUES ($1, 'Ótimo! Você passou com nota ' || $2 || '. Próxima aula desbloqueada!', 'sucesso')`,
        [session.id, Number(nota).toFixed(1)]
      );
    }
  }

  return NextResponse.json({ ok: true, nota });
}
