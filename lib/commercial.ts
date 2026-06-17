import { getSession } from "@/lib/auth";

export const COMMERCIAL_STAGES = [
  { id: "novo", label: "Novo lead", color: "badge-muted" },
  { id: "qualificado", label: "Qualificado", color: "badge-teal" },
  { id: "reuniao", label: "Reuniao", color: "badge-purple" },
  { id: "proposta", label: "Proposta", color: "badge-warning" },
  { id: "negociacao", label: "Negociacao", color: "badge-warning" },
  { id: "ganho", label: "Fechado", color: "badge-success" },
  { id: "perdido", label: "Perdido", color: "badge-danger" },
] as const;

export const COMMERCIAL_CHANNELS = ["whatsapp", "email"] as const;
export const COMMERCIAL_OBJECTIVES = ["prospeccao", "followup", "reativacao", "fechamento"] as const;
export const COMMERCIAL_TONES = ["consultivo", "direto", "premium"] as const;

type OptimizeInput = {
  canal: "whatsapp" | "email";
  objetivo: string;
  tom: string;
  empresa?: string | null;
  nomeContato?: string | null;
  contexto?: string | null;
  assunto?: string | null;
};

type CommercialCopyResult = {
  assunto: string;
  mensagem: string;
  source?: "fallback" | "openai";
  warning?: string;
};

export function normalizeStage(value: unknown) {
  const stage = String(value || "").trim().toLowerCase();
  return COMMERCIAL_STAGES.some((item) => item.id === stage) ? stage : "novo";
}

export function normalizeChannel(value: unknown) {
  return value === "email" ? "email" : "whatsapp";
}

export function normalizeTone(value: unknown) {
  return COMMERCIAL_TONES.includes(value as (typeof COMMERCIAL_TONES)[number])
    ? (value as (typeof COMMERCIAL_TONES)[number])
    : "consultivo";
}

export function normalizeObjective(value: unknown) {
  return COMMERCIAL_OBJECTIVES.includes(value as (typeof COMMERCIAL_OBJECTIVES)[number])
    ? (value as (typeof COMMERCIAL_OBJECTIVES)[number])
    : "prospeccao";
}

export function fillTemplate(template: string, vars: Record<string, string | null | undefined>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] || "").trim());
}

export function optimizeCommercialCopy(input: OptimizeInput): CommercialCopyResult {
  const canal = normalizeChannel(input.canal);
  const objetivo = normalizeObjective(input.objetivo);
  const tom = normalizeTone(input.tom);
  const nomeContato = String(input.nomeContato || "responsavel").trim();
  const empresa = String(input.empresa || "sua operacao").trim();
  const contexto = String(input.contexto || "").trim();

  const abertura =
    tom === "premium"
      ? `Ola, ${nomeContato}. Falo da CondoJob Educacional.`
      : tom === "direto"
        ? `Ola, ${nomeContato}. Tudo bem?`
        : `Ola, ${nomeContato}. Espero que esteja bem.`;

  const prova =
    objetivo === "reativacao"
      ? `Retomando nosso contato sobre desenvolvimento profissional para equipes condominiais.`
      : objetivo === "fechamento"
        ? `Estruturamos uma proposta objetiva para elevar padrao operacional, atendimento e seguranca.`
        : `Estamos apoiando condominios e administradoras com capacitacao profissional para equipes operacionais.`;

  const valor =
    tom === "direto"
      ? `A plataforma organiza treinamento, progresso, certificacao e acompanhamento comercial em um fluxo simples.`
      : `A plataforma organiza cursos, trilhas, certificacao e acompanhamento de desempenho, facilitando a gestao e a evolucao do time.`;

  const callToAction =
    objetivo === "fechamento"
      ? `Se fizer sentido para ${empresa}, posso te enviar a proposta final hoje.`
      : objetivo === "followup"
        ? `Se fizer sentido, posso te encaminhar uma apresentacao curta ainda hoje.`
        : objetivo === "reativacao"
          ? `Se ainda estiver avaliando esse tipo de solucao, posso retomar os pontos principais em uma mensagem objetiva.`
          : `Posso te mostrar, em poucos minutos, como isso pode funcionar para ${empresa}?`;

  const contextoLinha = contexto ? `\n\nContexto: ${contexto}.` : "";

  if (canal === "email") {
    const assunto =
      String(input.assunto || "").trim() ||
      (objetivo === "reativacao"
        ? "Retomada da apresentacao CondoJob Educacional"
        : objetivo === "fechamento"
          ? "Proposta comercial CondoJob Educacional"
          : "Capacitacao profissional para sua operacao condominial");
    const mensagem = `${abertura}\n\n${prova}\n\n${valor}${contextoLinha}\n\n${callToAction}\n\nFico a disposicao.`;
    return { assunto, mensagem, source: "fallback" };
  }

  const mensagem = `${abertura} ${prova} ${valor}${contexto ? ` Contexto: ${contexto}.` : ""} ${callToAction}`.replace(/\s+/g, " ").trim();
  return { assunto: "", mensagem, source: "fallback" };
}

function extractOpenAIText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  const texts: string[] = [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const part of content) {
      if (typeof part?.text === "string" && part.text.trim()) {
        texts.push(part.text.trim());
      }
    }
  }

  return texts.join("\n").trim();
}

export async function optimizeCommercialCopyWithAI(input: OptimizeInput): Promise<CommercialCopyResult> {
  const fallback = optimizeCommercialCopy(input);
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return {
      ...fallback,
      warning: "OPENAI_API_KEY nao configurada. Copy gerada pelo modelo interno.",
    };
  }

  const model = process.env.OPENAI_COMMERCIAL_MODEL?.trim() || "gpt-4.1-mini";
  const canal = normalizeChannel(input.canal);
  const objetivo = normalizeObjective(input.objetivo);
  const tom = normalizeTone(input.tom);
  const empresa = String(input.empresa || "a operacao do cliente").trim();
  const nomeContato = String(input.nomeContato || "responsavel").trim();
  const contexto = String(input.contexto || "").trim();
  const assuntoAtual = String(input.assunto || "").trim();

  const prompt = [
    "Voce e um especialista comercial B2B da CondoJob Educacional.",
    "Gere uma copy curta, persuasiva, profissional e natural em portugues do Brasil.",
    `Canal: ${canal}.`,
    `Objetivo: ${objetivo}.`,
    `Tom: ${tom}.`,
    `Empresa alvo: ${empresa}.`,
    `Contato: ${nomeContato}.`,
    contexto ? `Contexto adicional: ${contexto}.` : "",
    assuntoAtual ? `Assunto atual de referencia: ${assuntoAtual}.` : "",
    canal === "email"
      ? "Responda em JSON com as chaves assunto e mensagem."
      : "Responda em JSON com as chaves assunto e mensagem. Para WhatsApp, deixe assunto vazio.",
    "Nao use markdown, cercas de codigo nem explicacoes extras.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        ...fallback,
        warning: `Falha na OpenAI (${response.status}). Copy gerada pelo modelo interno.${errorText ? ` ${errorText.slice(0, 180)}` : ""}`,
      };
    }

    const payload = await response.json().catch(() => ({}));
    const rawText = extractOpenAIText(payload);
    if (!rawText) {
      return {
        ...fallback,
        warning: "Resposta vazia da OpenAI. Copy gerada pelo modelo interno.",
      };
    }

    const jsonStart = rawText.indexOf("{");
    const jsonEnd = rawText.lastIndexOf("}");
    const jsonText = jsonStart >= 0 && jsonEnd > jsonStart ? rawText.slice(jsonStart, jsonEnd + 1) : rawText;
    const parsed = JSON.parse(jsonText);

    return {
      assunto: canal === "email" ? String(parsed?.assunto || fallback.assunto || "").trim() : "",
      mensagem: String(parsed?.mensagem || fallback.mensagem || "").trim(),
      source: "openai",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      ...fallback,
      warning: `Falha na OpenAI: ${message}. Copy gerada pelo modelo interno.`,
    };
  }
}

export async function requireCommercialSession() {
  const session = await getSession();
  if (!session || session.perfil !== "comercial") return null;
  return session;
}
