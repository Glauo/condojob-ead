import { NextRequest, NextResponse } from "next/server";
import { dbRun, dbQueryOne, initSchema } from "@/lib/db";
import { requireCommercialSession } from "@/lib/commercial";
import { sendCommercialDispatch } from "@/lib/commercial-dispatch";

type Lead = {
  id: string;
  empresa: string;
  nome_contato: string;
  email: string | null;
  whatsapp: string | null;
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function buildWhatsAppUrl(destino: string, mensagem: string) {
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`;
}

export async function POST(req: NextRequest) {
  await initSchema();
  const session = await requireCommercialSession();
  if (!session) return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  if (!body.leadId) return NextResponse.json({ error: "Lead obrigatoria." }, { status: 400 });
  if (!String(body.mensagem || "").trim()) {
    return NextResponse.json({ error: "Mensagem obrigatoria." }, { status: 400 });
  }

  const lead = await dbQueryOne<Lead>(
    `SELECT id, empresa, nome_contato, email, whatsapp
       FROM cj_comercial_leads
      WHERE id=$1`,
    [body.leadId]
  );
  if (!lead) return NextResponse.json({ error: "Lead nao encontrada." }, { status: 404 });
  if (!lead.whatsapp?.trim()) {
    return NextResponse.json({ error: "Lead sem numero de WhatsApp." }, { status: 400 });
  }

  const destino = normalizePhone(lead.whatsapp);
  if (!destino) {
    return NextResponse.json({ error: "Numero de WhatsApp invalido." }, { status: 400 });
  }

  const result = await sendCommercialDispatch({
    canal: "whatsapp",
    destino,
    assunto: "",
    mensagem: String(body.mensagem).trim(),
    lead,
    campanha: { id: "manual-whatsapp", nome: "WhatsApp manual" },
  });

  const whatsappUrl = buildWhatsAppUrl(destino, result.mensagem);

  await dbRun(
    `INSERT INTO cj_comercial_atividades (lead_id, tipo, titulo, descricao, meta, criado_por)
     VALUES ($1,'whatsapp',$2,$3,$4::jsonb,$5)`,
    [
      lead.id,
      "WhatsApp comercial",
      result.status === "enviado"
        ? "Mensagem enviada por WhatsApp."
        : result.status === "rascunho"
          ? "Mensagem preparada para envio manual no WhatsApp."
          : "Falha ao enviar mensagem por WhatsApp.",
      JSON.stringify({
        status: result.status,
        destino,
        whatsapp_url: whatsappUrl,
      }),
      session.id,
    ]
  );

  await dbRun(
    `UPDATE cj_comercial_leads
        SET ultima_interacao_em = now(),
            atualizado_em = now()
      WHERE id=$1`,
    [lead.id]
  );

  return NextResponse.json({
    ok: true,
    status: result.status,
    mensagem: result.mensagem,
    whatsappUrl: result.status === "rascunho" ? whatsappUrl : null,
    warning: result.status === "rascunho" ? "Webhook nao configurado. Abrindo WhatsApp para envio manual." : null,
  });
}
