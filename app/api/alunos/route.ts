import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { dbQueryOne, initSchema } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador")
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  await initSchema();

  const {
    nome, email, senha, telefone, celular_whatsapp,
    data_nascimento, rg, cpf, estado_civil,
    cep, cidade, rua, numero, complemento, perfil,
  } = await req.json();

  if (!nome?.trim() || !email?.trim() || !senha)
    return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
  if (senha.length < 6)
    return NextResponse.json({ error: "Senha deve ter mínimo 6 caracteres." }, { status: 400 });

  const perfilFinal = perfil === "coordenador" ? "coordenador" : "aluno";
  const hash = await bcrypt.hash(senha, 10);

  try {
    const user = await dbQueryOne(
      `INSERT INTO cj_users
        (nome, email, senha_hash, perfil, telefone, celular_whatsapp, data_nascimento, rg, cpf,
         estado_civil, cep, cidade, rua, numero, complemento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        nome.trim(),
        email.toLowerCase().trim(),
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
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    throw e;
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.perfil !== "coordenador")
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  await initSchema();

  const {
    id, nome, email, senha, telefone, celular_whatsapp,
    data_nascimento, rg, cpf, estado_civil,
    cep, cidade, rua, numero, complemento, ativo,
  } = await req.json();

  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  if (!nome?.trim() || !email?.trim())
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  if (senha && senha.length < 6)
    return NextResponse.json({ error: "Senha deve ter mínimo 6 caracteres." }, { status: 400 });

  const hash = senha ? await bcrypt.hash(senha, 10) : null;

  try {
    const user = await dbQueryOne(
      `UPDATE cj_users SET
        nome=$1, email=$2, telefone=$3, celular_whatsapp=$4, data_nascimento=$5, rg=$6, cpf=$7,
        estado_civil=$8, cep=$9, cidade=$10, rua=$11, numero=$12, complemento=$13, ativo=$14,
        senha_hash = COALESCE($15, senha_hash)
       WHERE id=$16 AND perfil='aluno'
       RETURNING id`,
      [
        nome.trim(),
        email.toLowerCase().trim(),
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
    if (!user) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    throw e;
  }
}
