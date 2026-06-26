import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initSchema, dbQueryOne } from "@/lib/db";
import { signSession, setSessionCookie } from "@/lib/auth";

function normalizeLogin(value: unknown) {
  const login = String(value || "").toLowerCase().trim();
  return login || null;
}

function normalizeEmail(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { nome, login, email, senha, telefone } = await req.json();

    const nomeLimpo = String(nome || "").trim();
    const emailLimpo = normalizeEmail(email);
    const loginLimpo = normalizeLogin(login);
    const senhaInformada = String(senha || "");
    const telefoneLimpo = String(telefone || "").trim();

    if (!nomeLimpo || !emailLimpo || !loginLimpo || !senhaInformada) {
      return NextResponse.json({ error: "Nome, login, e-mail e senha sao obrigatorios." }, { status: 400 });
    }

    if (senhaInformada.length < 6) {
      return NextResponse.json({ error: "Senha deve ter minimo 6 caracteres." }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(senhaInformada, 10);
    const user = await dbQueryOne<{ id: string; nome: string; email: string }>(
      `INSERT INTO cj_users (nome, login, email, senha_hash, perfil, telefone, ativo)
       VALUES ($1, $2, $3, $4, 'comercial', $5, true)
       RETURNING id, nome, email`,
      [nomeLimpo, loginLimpo, emailLimpo, senhaHash, telefoneLimpo || null]
    );

    if (!user) {
      throw new Error("Falha ao criar usuario comercial.");
    }

    const token = await signSession({ id: user.id, nome: user.nome, email: user.email, perfil: "comercial" });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, perfil: "comercial", redirectTo: "/comercial" });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Login ou e-mail comercial ja cadastrado." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
