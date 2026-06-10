import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQueryOne, dbRun, initSchema } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/mercadopago";

type Curso = {
  id: string;
  nome: string;
  preco: number;
  tipo: string | null;
};

type NovoPagamento = { id: string };

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const session = await getSession();
    if (!session || session.perfil !== "aluno") {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }

    const { curso_id } = await req.json();
    if (!curso_id) return NextResponse.json({ error: "curso_id obrigatorio." }, { status: 400 });

    const curso = await dbQueryOne<Curso>(
      "SELECT id, nome, preco, COALESCE(tipo, 'principal') AS tipo FROM cj_cursos WHERE id=$1",
      [curso_id]
    );
    if (!curso || curso.tipo !== "especializacao") {
      return NextResponse.json({ error: "Especializacao nao encontrada." }, { status: 404 });
    }

    const matricula = await dbQueryOne<{ id: string }>(
      "SELECT id FROM cj_matriculas WHERE usuario_id=$1 AND curso_id=$2",
      [session.id, curso.id]
    );
    if (matricula) return NextResponse.json({ ok: true, matriculado: true });

    if (Number(curso.preco) <= 0) {
      await dbRun(
        `INSERT INTO cj_matriculas (usuario_id, curso_id, status)
         VALUES ($1,$2,'ativo')
         ON CONFLICT (usuario_id, curso_id) DO UPDATE SET status='ativo'`,
        [session.id, curso.id]
      );
      return NextResponse.json({ ok: true, matriculado: true }, { status: 201 });
    }

    const aluno = await dbQueryOne<{ nome: string; email: string }>(
      "SELECT nome, email FROM cj_users WHERE id=$1 AND perfil='aluno'",
      [session.id]
    );
    if (!aluno) return NextResponse.json({ error: "Aluno nao encontrado." }, { status: 404 });

    const pagamento = await dbQueryOne<NovoPagamento>(
      `INSERT INTO cj_pagamentos (usuario_id, curso_id, descricao, valor, vencimento)
       VALUES ($1,$2,$3,$4,(CURRENT_DATE + INTERVAL '3 days')::date)
       RETURNING id`,
      [session.id, curso.id, `Especializacao - ${curso.nome}`, Number(curso.preco)]
    );
    if (!pagamento) return NextResponse.json({ error: "Nao foi possivel gerar a cobranca." }, { status: 500 });

    const preference = await createMercadoPagoPreference({
      pagamentoId: pagamento.id,
      cursoNome: curso.nome,
      alunoNome: aluno.nome,
      alunoEmail: aluno.email,
      valor: Number(curso.preco),
      origin: req.nextUrl.origin,
    });

    return NextResponse.json({ ok: true, pagamentoId: pagamento.id, ...preference }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: (error as Error).message || "Erro interno." }, { status: 500 });
  }
}
