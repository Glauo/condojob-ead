import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbQueryOne, initSchema } from "@/lib/db";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

type User = { id: string; nome: string; email: string; senha_hash: string; perfil: "aluno" | "coordenador" };

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { email, senha } = await req.json();
    if (!email || !senha) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = await dbQueryOne<User>(
      "SELECT id, nome, email, senha_hash, perfil FROM cj_users WHERE email = $1 AND ativo = true",
      [email.toLowerCase().trim()]
    );

    if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }

    const token = await signSession({ id: user.id, nome: user.nome, email: user.email, perfil: user.perfil });
    await setSessionCookie(token);

    return NextResponse.json({ perfil: user.perfil, nome: user.nome });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

/* Seed: POST /api/auth/seed — cria coordenador padrão */
export async function PUT(req: NextRequest) {
  try {
    await initSchema();
    const { nome, email, senha, perfil, adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== "condojob2026") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
    const hash = await bcrypt.hash(senha, 10);
    await dbQueryOne(
      `INSERT INTO cj_users (nome, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome
       RETURNING id`,
      [nome, email.toLowerCase().trim(), hash, perfil || "coordenador"]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
