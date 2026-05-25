import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, dbQuery, dbQueryOne, dbRun } from "@/lib/db";

function normalizeOrder(value: unknown) {
  const order = Number(value);
  return Number.isFinite(order) && order > 0 ? Math.floor(order) : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursoId = searchParams.get("curso_id");
  if (!cursoId) return NextResponse.json({ error: "curso_id obrigatorio." }, { status: 400 });

  const aulas = await dbQuery(
    "SELECT id, titulo, ordem, video_url, conteudo, materiais FROM cj_aulas WHERE curso_id=$1 ORDER BY ordem ASC, criado_em ASC, id ASC",
    [cursoId]
  );
  return NextResponse.json(aulas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { curso_id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!curso_id || !titulo?.trim()) {
    return NextResponse.json({ error: "curso_id e titulo sao obrigatorios." }, { status: 400 });
  }
  if (materiais !== undefined && !Array.isArray(materiais)) {
    return NextResponse.json({ error: "Materiais deve ser uma lista." }, { status: 400 });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const maxRes = await client.query<{ max_ordem: number }>(
      "SELECT COALESCE(MAX(ordem), 0)::int AS max_ordem FROM cj_aulas WHERE curso_id=$1",
      [curso_id]
    );
    const maxOrder = Number(maxRes.rows[0]?.max_ordem ?? 0);
    const requestedOrder = normalizeOrder(ordem);
    const targetOrder = requestedOrder ? Math.min(requestedOrder, maxOrder + 1) : maxOrder + 1;

    await client.query(
      "UPDATE cj_aulas SET ordem = ordem + 1 WHERE curso_id=$1 AND ordem >= $2",
      [curso_id, targetOrder]
    );
    const aula = await client.query(
      `INSERT INTO cj_aulas (curso_id, titulo, ordem, video_url, conteudo, materiais)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)
       RETURNING id, ordem`,
      [curso_id, titulo.trim(), targetOrder, video_url || null, conteudo || null, JSON.stringify(materiais || [])]
    );
    await client.query("COMMIT");
    return NextResponse.json(aula.rows[0], { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { id, titulo, ordem, video_url, conteudo, materiais } = await req.json();
  if (!id || !titulo?.trim()) {
    return NextResponse.json({ error: "ID e titulo sao obrigatorios." }, { status: 400 });
  }
  if (materiais !== undefined && !Array.isArray(materiais)) {
    return NextResponse.json({ error: "Materiais deve ser uma lista." }, { status: 400 });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const atual = await client.query<{ curso_id: string; ordem: number }>(
      "SELECT curso_id, ordem FROM cj_aulas WHERE id=$1 FOR UPDATE",
      [id]
    );
    if (!atual.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Aula nao encontrada." }, { status: 404 });
    }

    const { curso_id: cursoId, ordem: oldOrder } = atual.rows[0];
    const maxRes = await client.query<{ max_ordem: number }>(
      "SELECT COALESCE(MAX(ordem), 1)::int AS max_ordem FROM cj_aulas WHERE curso_id=$1",
      [cursoId]
    );
    const maxOrder = Number(maxRes.rows[0]?.max_ordem ?? 1);
    const requestedOrder = normalizeOrder(ordem);
    const targetOrder = Math.min(requestedOrder ?? oldOrder, maxOrder);

    if (targetOrder < oldOrder) {
      await client.query(
        "UPDATE cj_aulas SET ordem = ordem + 1 WHERE curso_id=$1 AND id<>$2 AND ordem >= $3 AND ordem < $4",
        [cursoId, id, targetOrder, oldOrder]
      );
    } else if (targetOrder > oldOrder) {
      await client.query(
        "UPDATE cj_aulas SET ordem = ordem - 1 WHERE curso_id=$1 AND id<>$2 AND ordem > $3 AND ordem <= $4",
        [cursoId, id, oldOrder, targetOrder]
      );
    }

    const aula = await client.query(
      `UPDATE cj_aulas
       SET titulo=$1, ordem=$2, video_url=$3, conteudo=$4, materiais=$5::jsonb
       WHERE id=$6
       RETURNING id, ordem, materiais`,
      [titulo.trim(), targetOrder, video_url || null, conteudo || null, JSON.stringify(materiais || []), id]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, aula: aula.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });

  const aula = await dbQueryOne<{ curso_id: string }>("SELECT curso_id FROM cj_aulas WHERE id=$1", [id]);
  await dbRun("DELETE FROM cj_aulas WHERE id=$1", [id]);
  if (aula?.curso_id) {
    await dbRun(
      `WITH ordered AS (
         SELECT id, ROW_NUMBER() OVER (ORDER BY ordem ASC, criado_em ASC, id ASC)::int AS nova_ordem
         FROM cj_aulas
         WHERE curso_id=$1
       )
       UPDATE cj_aulas a
       SET ordem = ordered.nova_ordem
       FROM ordered
       WHERE a.id = ordered.id`,
      [aula.curso_id]
    );
  }
  return NextResponse.json({ ok: true });
}
