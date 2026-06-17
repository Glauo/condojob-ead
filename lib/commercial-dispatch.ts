import { fillTemplate } from "@/lib/commercial";

type DispatchInput = {
  canal: "whatsapp" | "email";
  destino: string;
  assunto?: string | null;
  mensagem: string;
  lead: {
    id: string;
    empresa: string;
    nome_contato: string;
    email: string | null;
    whatsapp: string | null;
  };
  campanha: {
    id: string;
    nome: string;
  };
};

export async function sendCommercialDispatch(input: DispatchInput) {
  const webhook =
    input.canal === "email"
      ? process.env.COMMERCIAL_EMAIL_WEBHOOK_URL?.trim()
      : process.env.COMMERCIAL_WHATSAPP_WEBHOOK_URL?.trim();

  const mensagem = fillTemplate(input.mensagem, {
    empresa: input.lead.empresa,
    nome_contato: input.lead.nome_contato,
    email: input.lead.email,
    whatsapp: input.lead.whatsapp,
  });

  if (!webhook) {
    return {
      status: "rascunho" as const,
      assunto: input.assunto || "",
      mensagem,
      providerResponse: { queued: false, reason: "webhook_nao_configurado" },
    };
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      canal: input.canal,
      destino: input.destino,
      assunto: input.assunto || "",
      mensagem,
      lead: input.lead,
      campanha: input.campanha,
    }),
  });

  const providerResponse = await response.json().catch(() => ({ status: response.status }));
  if (!response.ok) {
    return {
      status: "erro" as const,
      assunto: input.assunto || "",
      mensagem,
      providerResponse,
      errorText: `Webhook retornou ${response.status}.`,
    };
  }

  return {
    status: "enviado" as const,
    assunto: input.assunto || "",
    mensagem,
    providerResponse,
  };
}
