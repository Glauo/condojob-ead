import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { dbQueryOne, initSchema } from "@/lib/db";

function normalizeLogin(value: unknown) {
  const login = String(value || "").toLowerCase().trim();
  return login || null;
}

function normalizeEmail(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador")
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  await initSchema();

  const {
    nome, login, email, senha, telefone, celular_whatsapp,
    data_nascimento, rg, cpf, estado_civil,
    cep, cidade, rua, numero, complemento, perfil,
  } = await req.json();

  const perfilFinal = perfil === "coordenador" ? "coordenador" : "aluno";
  if (!nome?.trim() || !email?.trim() || !senha)
    return NextResponse.json({ error: "Nome, e-mail e senha sao obrigatorios." }, { status: 400 });
  if (perfilFinal === "coordenador" && !login?.trim())
    return NextResponse.json({ error: "Login do coordenador e obrigatorio." }, { status: 400 });
  if (senha.length < 6)
    return NextResponse.json({ error: "Senha deve ter minimo 6 caracteres." }, { status: 400 });

  const emailLimpo = normalizeEmail(email);
  const loginFinal = perfilFinal === "aluno" ? emailLimpo : normalizeLogin(login);
  const hash = await bcrypt.hash(senha, 10);

  try {
    const user = await dbQueryOne(
      `INSERT INTO cj_users
        (nome, login, email, senha_hash, perfil, telefone, celular_whatsapp, data_nascimento, rg, cpf,
         estado_civil, cep, cidade, rua, numero, complemento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id`,
      [
        nome.trim(),
        loginFinal,
        emailLimpo,
        hash,
        perfilFinal,
        telefone || null,
        celular_whatsapp || null,
        data_nascimento || null,
        rg || null,
        cpf || null,
        estado_civil || null,
        cep || null,
        cidade || null,
        rua || null,
        numero || null,
        complemento || null,
      ]
    );
    return NextResponse.json(user, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "Login administrativo ou e-mail ja cadastrado." }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador")
    return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });

  await initSchema();

  const {
    id, nome, email, senha, telefone, celular_whatsapp,
    data_nascimento, rg, cpf, estado_civil,
    cep, cidade, rua, numero, complemento, ativo,
  } = await req.json();

  if (!id) return NextResponse.json({ error: "ID obrigatorio." }, { status: 400 });
  if (!nome?.trim() || !email?.trim())
    return NextResponse.json({ error: "Nome e e-mail sao obrigatorios." }, { status: 400 });
  if (senha && senha.length < 6)
    return NextResponse.json({ error: "Senha deve ter minimo 6 caracteres." }, { status: 400 });

  const hash = senha ? await bcrypt.hash(senha, 10) : null;
  const emailLimpo = normalizeEmail(email);

  try {
    const user = await dbQueryOne(
      `UPDATE cj_users SET
        nome=$1, login=$2, email=$3, telefone=$4, celular_whatsapp=$5, data_nascimento=$6, rg=$7, cpf=$8,
        estado_civil=$9, cep=$10, cidade=$11, rua=$12, numero=$13, complemento=$14, ativo=$15,
        senha_hash = COALESCE($16, senha_hash)
       WHERE id=$17 AND perfil='aluno'
       RETURNING id`,
      [
        nome.trim(),
        emailLimpo,
        emailLimpo,
        telefone || null,
        celular_whatsapp || null,
        data_nascimento || null,
        rg || null,
        cpf || null,
        estado_civil || null,
        cep || null,
        cidade || null,
        rua || null,
        numero || null,
        complemento || null,
        ativo ?? true,
        hash,
        id,
      ]
    );
    if (!user) return NextResponse.json({ error: "Aluno nao encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "E-mail ja cadastrado." }, { status: 409 });
    throw e;
  }
}
