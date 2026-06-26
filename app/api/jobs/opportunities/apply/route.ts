import { NextRequest, NextResponse } from "next/server";
import { db, initSchema, dbQueryOne } from "@/lib/db";
import { getJobSession } from "@/lib/job-auth";

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await getJobSession();
  if (!session || session.perfil !== "worker") {
    return NextResponse.json({ error: "Acesso restrito para trabalhadores." }, { status: 403 });
  }

  const client = await db.connect();
  try {
    const { opportunityId } = await req.json();
    const id = String(opportunityId || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Vaga invalida." }, { status: 400 });
    }

    await client.query("BEGIN");
    const opp = await client.query<{
      id: string;
      status: string;
      worker_id: string | null;
      titulo: string;
    }>(
      `SELECT id, status, worker_id, titulo
         FROM cj_job_opportunities
        WHERE id = $1
          AND ativo = true
        FOR UPDATE`,
      [id]
    );

    const vaga = opp.rows[0];
    if (!vaga) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Vaga nao encontrada." }, { status: 404 });
    }

    if (vaga.worker_id && vaga.worker_id !== session.id) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Esta vaga ja foi aceita por outro trabalhador." }, { status: 409 });
    }

    await client.query(
      `INSERT INTO cj_job_applications (opportunity_id, worker_id, status)
       VALUES ($1,$2,'aceita')
       ON CONFLICT (opportunity_id, worker_id)
       DO UPDATE SET status='aceita'`,
      [id, session.id]
    );

    await client.query(
      `UPDATE cj_job_opportunities
          SET status='aceita',
              worker_id=$2,
              aceito_em=now()
        WHERE id=$1`,
      [id, session.id]
    );

    await client.query(
      `UPDATE cj_job_applications
          SET status = CASE WHEN worker_id = $2 THEN 'aceita' ELSE 'cancelada' END
        WHERE opportunity_id = $1`,
      [id, session.id]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, message: `Vaga aceita: ${vaga.titulo}` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  } finally {
    client.release();
  }
}
