import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbQueryOne, initSchema } from "@/lib/db";
import { createMercadoPagoPreference } from "@/lib/mercadopago";

type Pagamento = {
  id: string;
  usuario_id: string;
  curso_id: string | null;
  descricao: string | null;
  valor: number;
  status: string;
  checkout_url: string | null;
  aluno_nome: string;
  aluno_email: string;
  curso_nome: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.perfil !== "aluno") {
      return NextResponse.json({ error: "Nao autorizado." }, { status: 403 });
    }

    await initSchema();
    const { pagamento_id } = await req.json();
    if (!pagamento_id) return NextResponse.json({ error: "Pagamento obrigatorio." }, { status: 400 });

    const pagamento = await dbQueryOne<Pagamento>(
    `SELECT p.id, p.usuario_id, p.curso_id, p.descricao, p.valor, p.status, p.checkout_url,
              u.nome AS aluno_nome, u.email AS aluno_email, c.nome AS curso_nome
       FROM cj_pagamentos p
       JOIN cj_users u ON u.id = p.usuario_id
       LEFT JOIN cj_cursos c ON c.id = p.curso_id
       WHERE p.id=$1 AND p.usuario_id=$2`,
      [pagamento_id, session.id]
    );

    if (!pagamento) return NextResponse.json({ error: "Pagamento nao encontrado." }, { status: 404 });
    if (pagamento.status === "pago") return NextResponse.json({ error: "Pagamento ja aprovado." }, { status: 400 });
    if (pagamento.checkout_url?.trim()) {
      return NextResponse.json({ checkoutUrl: pagamento.checkout_url.trim(), pagamentoId: pagamento.id });
    }

    const preference = await createMercadoPagoPreference({
      pagamentoId: pagamento.id,
      cursoNome: pagamento.curso_nome || pagamento.descricao || "Curso CondoJob EAD",
      alunoNome: pagamento.aluno_nome,
      alunoEmail: pagamento.aluno_email,
      valor: Number(pagamento.valor),
      origin: req.nextUrl.origin,
    });

    return NextResponse.json(preference);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message || "Erro interno." }, { status: 500 });
  }
}
