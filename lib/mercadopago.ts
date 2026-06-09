import { dbQueryOne, dbRun } from "@/lib/db";
import { issueStudentAccessCredentials } from "@/lib/access-credentials";

const MP_API = "https://api.mercadopago.com";

type PreferenceInput = {
  pagamentoId: string;
  cursoNome: string;
  alunoNome: string;
  alunoEmail: string;
  valor: number;
  origin: string;
};

type PreferenceResponse = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

type PixPaymentResponse = PaymentResponse & {
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
};

type PaymentResponse = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  payer?: {
    email?: string;
  };
};

type LocalPayment = {
  id: string;
  usuario_id: string;
  curso_id: string | null;
  status: string;
};

function getAccessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || "";
}

export function assertMercadoPagoConfigured() {
  if (!getAccessToken()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  }
}

export async function createMercadoPagoPreference(input: PreferenceInput) {
  assertMercadoPagoConfigured();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || input.origin).replace(/\/$/, "");
  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          id: input.pagamentoId,
          title: input.cursoNome,
          description: "Curso CondoJob Educacional",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(input.valor),
        },
      ],
      payer: {
        name: input.alunoNome,
        email: input.alunoEmail,
      },
      external_reference: input.pagamentoId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${baseUrl}/pagamento/retorno?status=success`,
        failure: `${baseUrl}/pagamento/retorno?status=failure`,
        pending: `${baseUrl}/pagamento/retorno?status=pending`,
      },
      auto_return: "approved",
      payment_methods: {
        installments: 12,
      },
      statement_descriptor: "CONDOJOB EDUCACIONAL",
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PreferenceResponse> & { message?: string };
  if (!response.ok || !data.id) {
    throw new Error(data.message || "Nao foi possivel gerar o pagamento no Mercado Pago.");
  }

  const checkoutUrl = data.init_point || data.sandbox_init_point || "";
  await dbRun(
    `UPDATE cj_pagamentos
     SET mp_preference_id=$1, mp_external_reference=$2, checkout_url=$3
     WHERE id=$2`,
    [data.id, input.pagamentoId, checkoutUrl]
  );

  return { preferenceId: data.id, checkoutUrl };
}

export async function createMercadoPagoPixPayment(input: PreferenceInput) {
  assertMercadoPagoConfigured();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || input.origin).replace(/\/$/, "");
  const response = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `pix-${input.pagamentoId}`,
    },
    body: JSON.stringify({
      transaction_amount: Number(input.valor),
      description: input.cursoNome,
      payment_method_id: "pix",
      external_reference: input.pagamentoId,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      payer: {
        email: input.alunoEmail,
        first_name: input.alunoNome,
      },
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PixPaymentResponse> & { message?: string };
  if (!response.ok || !data.id) {
    throw new Error(data.message || "Nao foi possivel gerar o Pix no Mercado Pago.");
  }

  const transactionData = data.point_of_interaction?.transaction_data;
  await dbRun(
    `UPDATE cj_pagamentos
     SET mp_payment_id=$1, mp_external_reference=$2, checkout_url=COALESCE(checkout_url, $3), mp_status_detail=$4
     WHERE id=$2`,
    [String(data.id), input.pagamentoId, transactionData?.ticket_url || null, data.status_detail || null]
  );

  return {
    paymentId: String(data.id),
    status: data.status || "pending",
    qrCode: transactionData?.qr_code || "",
    qrCodeBase64: transactionData?.qr_code_base64 || "",
    ticketUrl: transactionData?.ticket_url || "",
  };
}

function mapMercadoPagoStatus(status: string) {
  if (status === "approved") return "pago";
  if (["cancelled", "rejected", "refunded", "charged_back"].includes(status)) return "cancelado";
  return "pendente";
}

async function findLocalPayment(data: Partial<PaymentResponse>) {
  if (data.external_reference) {
    return dbQueryOne<LocalPayment>(
      "SELECT id, usuario_id, curso_id, status FROM cj_pagamentos WHERE id=$1 OR mp_external_reference=$1",
      [data.external_reference]
    );
  }

  const payerEmail = data.payer?.email?.toLowerCase().trim();
  const amount = Number(data.transaction_amount);
  if (!payerEmail || !Number.isFinite(amount) || amount <= 0) return null;

  return dbQueryOne<LocalPayment>(
    `SELECT p.id, p.usuario_id, p.curso_id, p.status
     FROM cj_pagamentos p
     JOIN cj_users u ON u.id = p.usuario_id
     WHERE p.status = 'pendente'
       AND LOWER(u.email) = $1
       AND ABS(p.valor::numeric - $2::numeric) < 0.01
     ORDER BY p.criado_em DESC
     LIMIT 1`,
    [payerEmail, amount]
  );
}

export async function confirmMercadoPagoPayment(paymentId: string) {
  assertMercadoPagoConfigured();

  const response = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });

  const data = (await response.json().catch(() => ({}))) as Partial<PaymentResponse> & { message?: string };
  if (!response.ok || !data.id) {
    throw new Error(data.message || "Pagamento nao encontrado no Mercado Pago.");
  }

  const local = await findLocalPayment(data);
  if (!local) return { status: data.status || "unknown", localStatus: "pendente" };

  const localStatus = mapMercadoPagoStatus(data.status || "");

  if (localStatus === "pago") {
    await dbRun(
      `UPDATE cj_pagamentos
       SET status='pago', pago_em=COALESCE(pago_em, now()), mp_payment_id=$1, mp_status_detail=$2
       WHERE id=$3`,
      [String(data.id), data.status_detail || null, local.id]
    );
    await dbRun("UPDATE cj_users SET ativo=true WHERE id=$1 AND perfil='aluno'", [local.usuario_id]);
    if (local.curso_id) {
      await dbRun(
        `INSERT INTO cj_matriculas (usuario_id, curso_id, status)
         VALUES ($1,$2,'ativo')
         ON CONFLICT (usuario_id, curso_id) DO UPDATE SET status='ativo'`,
        [local.usuario_id, local.curso_id]
      );
    }
    await dbRun(
      `INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo)
       VALUES ($1, 'Pagamento aprovado. Seu curso foi liberado.', 'success')`,
      [local.usuario_id]
    );
    await issueStudentAccessCredentials(local.usuario_id);
  } else if (localStatus === "cancelado") {
    await dbRun(
      `UPDATE cj_pagamentos
       SET status='cancelado', pago_em=NULL, mp_payment_id=$1, mp_status_detail=$2
       WHERE id=$3`,
      [String(data.id), data.status_detail || null, local.id]
    );
  } else {
    await dbRun(
      `UPDATE cj_pagamentos
       SET status='pendente', pago_em=NULL, mp_payment_id=$1, mp_status_detail=$2
       WHERE id=$3`,
      [String(data.id), data.status_detail || null, local.id]
    );
  }

  return { status: data.status || "unknown", localStatus, pagamentoId: local.id };
}
