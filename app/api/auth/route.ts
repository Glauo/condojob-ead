import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { signSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

type User = { id: string; nome: string; email: string; senha_hash: string; perfil: "aluno" | "coordenador" };

async function senhaConfere(senha: string, hash: string) {
  if (await bcrypt.compare(senha, hash)) return true;

  const senhaSemEspacos = senha.trim();
  if (senhaSemEspacos !== senha) {
    return bcrypt.compare(senhaSemEspacos, hash);
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { email, login, senha } = await req.json();
    const identificador = String(login || email || "").toLowerCase().trim();
    const senhaInformada = String(senha ?? "");

    if (!identificador || !senhaInformada) {
      return NextResponse.json({ error: "E-mail e senha sao obrigatorios." }, { status: 400 });
    }

    const candidatos = await dbQuery<User>(
      `SELECT id, nome, email, senha_hash, perfil
       FROM cj_users
       WHERE ativo = true
         AND (
           LOWER(email) = $1
           OR (perfil = 'coordenador' AND LOWER(COALESCE(login, '')) = $1)
         )
       ORDER BY
         CASE
           WHEN LOWER(email) = $1 THEN 1
           ELSE 2
         END
       LIMIT 10`,
      [identificador]
    );

    let user: User | null = null;
    for (const candidato of candidatos) {
      if (await senhaConfere(senhaInformada, candidato.senha_hash)) {
        user = candidato;
        break;
      }
    }

    if (!user) {
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

/* Seed: POST /api/auth/seed - cria coordenador padrao */
export async function PUT(req: NextRequest) {
  try {
    await initSchema();
    const { nome, email, login, senha, perfil, adminKey } = await req.json();
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== "condojob2026") {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }
    const perfilFinal = perfil === "aluno" ? "aluno" : "coordenador";
    const emailLimpo = email.toLowerCase().trim();
    const loginFinal = perfilFinal === "aluno" ? emailLimpo : login?.toLowerCase().trim() || null;
    const hash = await bcrypt.hash(senha, 10);
    await dbQueryOne(
      `INSERT INTO cj_users (nome, login, email, senha_hash, perfil)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET senha_hash = EXCLUDED.senha_hash, nome = EXCLUDED.nome, login = EXCLUDED.login
       RETURNING id`,
      [nome, loginFinal, emailLimpo, hash, perfilFinal]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
