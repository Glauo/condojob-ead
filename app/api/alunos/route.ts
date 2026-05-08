import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbRun, initSchema } from "@/lib/db";

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

  const {
    id, nome, telefone, celular_whatsapp,
    data_nascimento, rg, cpf, estado_civil,
    cep, cidade, rua, numero, complemento, ativo,
  } = await req.json();

  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  await dbRun(
    `UPDATE cj_users SET
      nome=$1, telefone=$2, celular_whatsapp=$3, data_nascimento=$4, rg=$5, cpf=$6,
      estado_civil=$7, cep=$8, cidade=$9, rua=$10, numero=$11, complemento=$12, ativo=$13
     WHERE id=$14`,
    [
      nome, telefone || null, celular_whatsapp || null,
      data_nascimento || null, rg || null, cpf || null,
      estado_civil || null, cep || null, cidade || null,
      rua || null, numero || null, complemento || null,
      ativo ?? true, id,
    ]
  );
  return NextResponse.json({ ok: true });
}
