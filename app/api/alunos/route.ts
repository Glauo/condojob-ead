import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbRun } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { nome, email, senha, telefone } = await req.json();
  if (!nome?.trim() || !email?.trim() || !senha) return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
  if (senha.length < 6) return NextResponse.json({ error: "Senha deve ter mínimo 6 caracteres." }, { status: 400 });
  const hash = await bcrypt.hash(senha, 10);
  try {
    const user = await dbQueryOne(
      "INSERT INTO cj_users (nome, email, senha_hash, perfil, telefone) VALUES ($1,$2,$3,'aluno',$4) RETURNING id",
      [nome.trim(), email.toLowerCase().trim(), hash, telefone || null]
    );
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  const { id, nome, telefone, ativo } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await dbRun("UPDATE cj_users SET nome=$1, telefone=$2, ativo=$3 WHERE id=$4", [nome, telefone || null, ativo ?? true, id]);
  return NextResponse.json({ ok: true });
}
