import { db, dbQueryOne, initSchema } from "@/lib/db";
import { sendCommercialDispatch } from "@/lib/commercial-dispatch";

type Campaign = {
  id: string;
  nome: string;
  canal: "whatsapp" | "email";
  status: string;
  filtro_estagio: string | null;
  filtro_origem: string | null;
  assunto: string | null;
  mensagem: string;
};

type Lead = {
  id: string;
  empresa: string;
  nome_contato: string;
  email: string | null;
  whatsapp: string | null;
};

export async function processCampaignDispatch(campaignId: string, actorId?: string | null) {
  await initSchema();
  const campanha = await dbQueryOne<Campaign>(
    `SELECT id, nome, canal, status, filtro_estagio, filtro_origem, assunto, mensagem
       FROM cj_comercial_campanhas
      WHERE id=$1`,
    [campaignId]
  );
  if (!campanha) {
    return { ok: false as const, error: "Campanha nao encontrada." };
  }

  const leads = await db.query<Lead>(
    `SELECT id, empresa, nome_contato, email, whatsapp
       FROM cj_comercial_leads
      WHERE status = 'ativo'
        AND ($1::text IS NULL OR estagio = $1)
        AND ($2::text IS NULL OR LOWER(COALESCE(origem, '')) = LOWER($2))
      ORDER BY atualizado_em DESC, criado_em DESC`,
    [campanha.filtro_estagio, campanha.filtro_origem]
  );

  const client = await db.connect();
  let enviados = 0;
  let rascunhos = 0;
  let erros = 0;

  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE cj_comercial_campanhas
          SET status='enviando', atualizado_em=now()
        WHERE id=$1`,
      [campanha.id]
    );

    for (const lead of leads.rows) {
      const destino = campanha.canal === "email" ? lead.email : lead.whatsapp;
      if (!destino) {
        await client.query(
          `INSERT INTO cj_comercial_disparos (campanha_id, lead_id, canal, destino, assunto, mensagem, status, erro_texto)
           VALUES ($1,$2,$3,$4,$5,$6,'erro',$7)`,
          [campanha.id, lead.id, campanha.canal, null, campanha.assunto, campanha.mensagem, "Lead sem destino configurado."]
        );
        erros += 1;
        continue;
      }

      const result = await sendCommercialDispatch({
        canal: campanha.canal,
        destino,
        assunto: campanha.assunto,
        mensagem: campanha.mensagem,
        lead,
        campanha: { id: campanha.id, nome: campanha.nome },
      });

      await client.query(
        `INSERT INTO cj_comercial_disparos (campanha_id, lead_id, canal, destino, assunto, mensagem, status, provider_resposta, erro_texto, enviado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`,
        [
          campanha.id,
          lead.id,
          campanha.canal,
          destino,
          result.assunto || null,
          result.mensagem,
          result.status,
          JSON.stringify(result.providerResponse || {}),
          "errorText" in result ? result.errorText || null : null,
          result.status === "enviado" ? new Date().toISOString() : null,
        ]
      );

      await client.query(
        `INSERT INTO cj_comercial_atividades (lead_id, tipo, titulo, descricao, meta, criado_por)
         VALUES ($1,'campanha',$2,$3,$4::jsonb,$5)`,
        [
          lead.id,
          `Campanha ${campanha.nome}`,
          result.status === "enviado"
            ? `Disparo realizado por ${campanha.canal}.`
            : result.status === "rascunho"
              ? `Disparo salvo como rascunho por falta de webhook de ${campanha.canal}.`
              : `Disparo com erro por ${campanha.canal}.`,
          JSON.stringify({ campanha_id: campanha.id, status: result.status }),
          actorId || null,
        ]
      );

      await client.query(
        `UPDATE cj_comercial_leads
            SET ultima_interacao_em = now(),
                estagio = CASE WHEN $2 = 'whatsapp' AND $3 = 'enviado' THEN 'mensagem_enviada' ELSE estagio END,
                atualizado_em = now()
          WHERE id=$1`,
        [lead.id, campanha.canal, result.status]
      );

      if (result.status === "enviado") enviados += 1;
      else if (result.status === "rascunho") rascunhos += 1;
      else erros += 1;
    }

    await client.query(
      `UPDATE cj_comercial_campanhas
          SET status='concluida',
              enviados = COALESCE(enviados, 0) + $2,
              entregues = COALESCE(entregues, 0) + $2,
              ultimo_disparo_em = now(),
              atualizado_em = now()
        WHERE id=$1`,
      [campanha.id, enviados]
    );

    await client.query("COMMIT");
    return { ok: true as const, enviados, rascunhos, erros, total: leads.rowCount };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(error);
    return { ok: false as const, error: "Erro ao disparar campanha." };
  } finally {
    client.release();
  }
}

export async function setCampaignAutoMode(campaignId: string, enabled: boolean) {
  const updated = await dbQueryOne<{ id: string; status: string; agendado_em: string | null }>(
    `UPDATE cj_comercial_campanhas
        SET status = CASE WHEN $2 THEN 'agendada' ELSE 'pausada' END,
            agendado_em = CASE
              WHEN $2 AND agendado_em IS NULL THEN now()
              ELSE agendado_em
            END,
            atualizado_em = now()
      WHERE id=$1
      RETURNING id, status, agendado_em`,
    [campaignId, enabled]
  );

  return updated;
}

export async function processDueCampaigns(limit = 3) {
  await initSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const due = await client.query<{ id: string }>(
      `WITH due AS (
         SELECT id
           FROM cj_comercial_campanhas
          WHERE status = 'agendada'
            AND agendado_em IS NOT NULL
            AND agendado_em <= now()
          ORDER BY agendado_em ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
       )
       UPDATE cj_comercial_campanhas c
          SET status = 'enviando',
              atualizado_em = now()
         FROM due
        WHERE c.id = due.id
      RETURNING c.id`,
      [limit]
    );
    await client.query("COMMIT");

    for (const campanha of due.rows) {
      await processCampaignDispatch(campanha.id, null);
    }

    return due.rowCount || 0;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(error);
    return 0;
  } finally {
    client.release();
  }
}
