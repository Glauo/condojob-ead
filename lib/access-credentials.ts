import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbQueryOne, dbRun } from "@/lib/db";

type StudentAccess = {
  id: string;
  nome: string;
  email: string;
  login: string | null;
  celular_whatsapp: string | null;
  acesso_enviado_em: string | null;
};

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#";
  const bytes = crypto.randomBytes(10);
  let password = "Cj";
  for (const byte of bytes) password += alphabet[byte % alphabet.length];
  password += symbols[bytes[0] % symbols.length];
  password += String(10 + (bytes[1] % 90));
  return password;
}

function onlyDigits(value: string | null) {
  return String(value || "").replace(/\D/g, "");
}

async function postWebhook(url: string, payload: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Webhook retornou ${response.status}: ${text.slice(0, 180)}`);
  }
}

async function sendAccessEmail(user: StudentAccess, login: string, password: string) {
  const url = process.env.ACCESS_EMAIL_WEBHOOK_URL?.trim();
  if (!url) {
    await dbRun(
      `INSERT INTO cj_logs (usuario_id, acao, detalhes)
       VALUES ($1, 'credenciais_email_nao_configurado', $2)`,
      [user.id, JSON.stringify({ email: user.email })]
    );
    return false;
  }

  await postWebhook(url, {
    to: user.email,
    name: user.nome,
    subject: "Acesso liberado - CondoJob Educacional",
    message: `Seu acesso ao CondoJob Educacional foi liberado.\n\nLogin: ${login}\nSenha temporaria: ${password}\n\nAcesse https://condojobead.com.br/login e altere sua senha no painel do aluno.`,
    login,
    password,
  });

  await dbRun(
    `INSERT INTO cj_logs (usuario_id, acao, detalhes)
     VALUES ($1, 'credenciais_email_enviado', $2)`,
    [user.id, JSON.stringify({ email: user.email })]
  );
  return true;
}

async function sendAccessWhatsapp(user: StudentAccess, login: string, password: string) {
  const url = process.env.ACCESS_WHATSAPP_WEBHOOK_URL?.trim();
  const phone = onlyDigits(user.celular_whatsapp);
  if (!url || !phone) {
    await dbRun(
      `INSERT INTO cj_logs (usuario_id, acao, detalhes)
       VALUES ($1, 'credenciais_whatsapp_nao_configurado', $2)`,
      [user.id, JSON.stringify({ whatsapp: phone || null, hasWebhook: Boolean(url) })]
    );
    return false;
  }

  await postWebhook(url, {
    to: phone,
    name: user.nome,
    message: `CondoJob Educacional: seu acesso foi liberado.\nLogin: ${login}\nSenha temporaria: ${password}\nAcesse: https://condojobead.com.br/login`,
    login,
    password,
  });

  await dbRun(
    `INSERT INTO cj_logs (usuario_id, acao, detalhes)
     VALUES ($1, 'credenciais_whatsapp_enviado', $2)`,
    [user.id, JSON.stringify({ whatsapp: phone })]
  );
  return true;
}

export async function issueStudentAccessCredentials(usuarioId: string) {
  const user = await dbQueryOne<StudentAccess>(
    `SELECT id, nome, email, login, celular_whatsapp, acesso_enviado_em
       FROM cj_users
      WHERE id=$1 AND perfil='aluno'`,
    [usuarioId]
  );

  if (!user) return { issued: false, reason: "aluno_nao_encontrado" };
  if (user.acesso_enviado_em) return { issued: false, reason: "credenciais_ja_emitidas" };

  const login = user.email.toLowerCase().trim();
  const password = generateTemporaryPassword();
  const hash = await bcrypt.hash(password, 10);

  await dbRun(
    `UPDATE cj_users
        SET login=$1,
            senha_hash=$2,
            acesso_enviado_em=now()
      WHERE id=$3 AND perfil='aluno'`,
    [login, hash, user.id]
  );

  await dbRun(
    `INSERT INTO cj_notificacoes (usuario_id, mensagem, tipo)
     VALUES ($1, 'Seu acesso foi liberado. Use o login enviado por e-mail/WhatsApp e altere sua senha no painel.', 'success')`,
    [user.id]
  );

  const results = { email: false, whatsapp: false };
  try {
    results.email = await sendAccessEmail(user, login, password);
  } catch (error) {
    await dbRun(
      `INSERT INTO cj_logs (usuario_id, acao, detalhes)
       VALUES ($1, 'credenciais_email_erro', $2)`,
      [user.id, JSON.stringify({ error: (error as Error).message })]
    );
  }

  try {
    results.whatsapp = await sendAccessWhatsapp(user, login, password);
  } catch (error) {
    await dbRun(
      `INSERT INTO cj_logs (usuario_id, acao, detalhes)
       VALUES ($1, 'credenciais_whatsapp_erro', $2)`,
      [user.id, JSON.stringify({ error: (error as Error).message })]
    );
  }

  await dbRun(
    `INSERT INTO cj_logs (usuario_id, acao, detalhes)
     VALUES ($1, 'credenciais_acesso_emitidas', $2)`,
    [user.id, JSON.stringify({ login, emailSent: results.email, whatsappSent: results.whatsapp })]
  );

  return { issued: true, login, ...results };
}
