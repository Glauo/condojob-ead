import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { createMercadoPagoPreference, assertMercadoPagoConfigured } from "@/lib/mercadopago";

type Curso = { id: string; nome: string; preco: number };
type Aluno = { id: string; ativo: boolean; perfil: string };
type NovoPagamento = { id: string };

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    assertMercadoPagoConfigured();

    const {
      nome, email, senha, curso_id, telefone, celular_whatsapp,
      data_nascimento, rg, cpf, estado_civil, cep, cidade, rua, numero, complemento,
    } = await req.json();

    if (!nome?.trim() || !email?.trim() || !senha || !curso_id) {
      return NextResponse.json({ error: "Nome, e-mail, senha e curso sao obrigatorios." }, { status: 400 });
    }
    if (senha.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no minimo 6 caracteres." }, { status: 400 });
    }

    const curso = await dbQueryOne<Curso>(
      "SELECT id, nome, preco FROM cj_cursos WHERE id=$1",
      [curso_id]
    );
    if (!curso) return NextResponse.json({ error: "Curso nao encontrado." }, { status: 404 });
    if (Number(curso.preco) <= 0) {
      return NextResponse.json({ error: "Este curso ainda nao possui preco configurado." }, { status: 400 });
    }

    const emailLimpo = email.toLowerCase().trim();
    const alunoExistente = await dbQueryOne<Aluno>(
      "SELECT id, ativo, perfil FROM cj_users WHERE email=$1",
      [emailLimpo]
    );

    if (alunoExistente?.perfil && alunoExistente.perfil !== "aluno") {
      return NextResponse.json({ error: "Este e-mail ja esta cadastrado em outro perfil." }, { status: 409 });
    }
    if (alunoExistente?.ativo) {
      return NextResponse.json({ error: "E-mail ja cadastrado. Acesse sua conta para pagar pelo financeiro." }, { status: 409 });
    }

    const hash = await bcrypt.hash(senha, 10);
    const aluno = alunoExistente
      ? await dbQueryOne<Aluno>(
        `UPDATE cj_users SET
          nome=$1, senha_hash=$2, telefone=$3, celular_whatsapp=$4, data_nascimento=$5, rg=$6, cpf=$7,
          estado_civil=$8, cep=$9, cidade=$10, rua=$11, numero=$12, complemento=$13, ativo=false
         WHERE id=$14 AND perfil='aluno'
         RETURNING id, ativo, perfil`,
        [
          nome.trim(),
          hash,
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
          alunoExistente.id,
        ]
      )
      : await dbQueryOne<Aluno>(
        `INSERT INTO cj_users
          (nome, email, senha_hash, perfil, telefone, celular_whatsapp, data_nascimento, rg, cpf,
           estado_civil, cep, cidade, rua, numero, complemento, ativo)
         VALUES ($1,$2,$3,'aluno',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false)
         RETURNING id, ativo, perfil`,
        [
          nome.trim(),
          emailLimpo,
          hash,
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

    if (!aluno) return NextResponse.json({ error: "Nao foi possivel cadastrar o aluno." }, { status: 500 });

    const pagamento = await dbQueryOne<NovoPagamento>(
      `INSERT INTO cj_pagamentos (usuario_id, curso_id, descricao, valor, vencimento)
       VALUES ($1,$2,$3,$4,(CURRENT_DATE + INTERVAL '3 days')::date)
       RETURNING id`,
      [aluno.id, curso.id, `Matricula - ${curso.nome}`, Number(curso.preco)]
    );

    if (!pagamento) {
      await dbRun("UPDATE cj_users SET ativo=false WHERE id=$1", [aluno.id]);
      return NextResponse.json({ error: "Nao foi possivel gerar a cobranca." }, { status: 500 });
    }

    const preference = await createMercadoPagoPreference({
      pagamentoId: pagamento.id,
      cursoNome: curso.nome,
      alunoNome: nome.trim(),
      alunoEmail: emailLimpo,
      valor: Number(curso.preco),
      origin: req.nextUrl.origin,
    });

    return NextResponse.json(preference, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "E-mail ja cadastrado. Acesse sua conta ou fale com o coordenador." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: (e as Error).message || "Erro interno." }, { status: 500 });
  }
}
