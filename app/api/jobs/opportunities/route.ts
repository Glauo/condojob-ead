import { NextRequest, NextResponse } from "next/server";
import { initSchema, dbQueryOne } from "@/lib/db";
import { getJobSession } from "@/lib/job-auth";

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const session = await getJobSession();
    if (!session || session.perfil !== "company") {
      return NextResponse.json({ error: "Acesso restrito para empresas." }, { status: 403 });
    }

    const body = await req.json();
    const titulo = String(body.titulo || "").trim();
    const descricao = String(body.descricao || "").trim();
    const tipoJornada = String(body.tipo_jornada || "freelancer").trim() || "freelancer";
    const faixaPagamento = String(body.faixa_pagamento || "").trim();
    const requisitos = String(body.requisitos || "").trim();
    const disponibilidade = String(body.disponibilidade || "").trim();
    const dataServico = String(body.data_servico || "").trim();
    const horaServico = String(body.hora_servico || "").trim();

    if (!titulo) {
      return NextResponse.json({ error: "Titulo da vaga e obrigatorio." }, { status: 400 });
    }

    await dbQueryOne(
      `INSERT INTO cj_job_opportunities (
         condo_id, titulo, descricao, tipo_jornada, faixa_pagamento, requisitos,
         disponibilidade, data_servico, hora_servico, status, ativo
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'aberta',true)
       RETURNING id`,
      [
        session.id,
        titulo,
        descricao || null,
        tipoJornada,
        faixaPagamento || null,
        requisitos || null,
        disponibilidade || null,
        dataServico || null,
        horaServico || null,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
