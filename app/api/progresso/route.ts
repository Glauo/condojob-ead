import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbRun } from "@/lib/db";
import { tryIssueCertificateForAula } from "@/lib/certificados";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { aula_id, percentual, concluido } = await req.json();
  if (!aula_id) return NextResponse.json({ error: "aula_id obrigatório." }, { status: 400 });
  await dbRun(
    `INSERT INTO cj_progresso (usuario_id, aula_id, percentual, concluido, concluido_em, atualizado_em)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (usuario_id, aula_id) DO UPDATE
     SET percentual = GREATEST(cj_progresso.percentual, EXCLUDED.percentual),
         concluido = EXCLUDED.concluido OR cj_progresso.concluido,
         concluido_em = CASE WHEN EXCLUDED.concluido AND cj_progresso.concluido_em IS NULL THEN now() ELSE cj_progresso.concluido_em END,
         atualizado_em = now()`,
    [session.id, aula_id, percentual || 0, Boolean(concluido), concluido ? new Date() : null]
  );
  const certificado = Boolean(concluido)
    ? await tryIssueCertificateForAula(session.id, aula_id)
    : null;
  return NextResponse.json({ ok: true, certificado });
}
