import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbRun, initSchema } from "@/lib/db";

type UserPassword = {
  id: string;
  senha_hash: string;
};

export async function PATCH(req: NextRequest) {
  try {
    await initSchema();
    const session = await getSession();
    if (!session || session.perfil !== "aluno") {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }

    const { senhaAtual, novaSenha } = await req.json();
    const atual = String(senhaAtual || "");
    const nova = String(novaSenha || "");

    if (!atual || !nova) {
      return NextResponse.json({ error: "Informe a senha atual e a nova senha." }, { status: 400 });
    }
    if (nova.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter no minimo 6 caracteres." }, { status: 400 });
    }

    const user = await dbQueryOne<UserPassword>(
      "SELECT id, senha_hash FROM cj_users WHERE id=$1 AND perfil='aluno' AND ativo=true",
      [session.id]
    );
    if (!user) return NextResponse.json({ error: "Aluno nao encontrado." }, { status: 404 });

    const ok = await bcrypt.compare(atual, user.senha_hash);
    if (!ok) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });

    const hash = await bcrypt.hash(nova, 10);
    await dbRun("UPDATE cj_users SET senha_hash=$1 WHERE id=$2 AND perfil='aluno'", [hash, session.id]);
    await dbRun(
      `INSERT INTO cj_logs (usuario_id, acao, detalhes)
       VALUES ($1, 'senha_aluno_alterada', $2)`,
      [session.id, JSON.stringify({ origem: "painel_aluno" })]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
