import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initSchema, dbQueryOne } from "@/lib/db";
import { signJobSession, setJobSessionCookie } from "@/lib/job-auth";

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const body = await req.json();
    const perfil = body.perfil === "company" ? "company" : "worker";
    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const senha = String(body.senha || "");
    const telefone = String(body.telefone || "").trim();
    const cidade = String(body.cidade || "").trim();

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: "Nome, e-mail e senha sao obrigatorios." }, { status: 400 });
    }

    const hash = await bcrypt.hash(senha, 10);

    if (perfil === "worker") {
      const nivel = String(body.nivel || "operacional").trim() || "operacional";
      const disponibilidade = String(body.disponibilidade || "").trim();
      const existente = await dbQueryOne<{ id: string }>(
        `SELECT id FROM cj_job_workers WHERE LOWER(email) = $1`,
        [email]
      );
      if (existente) {
        return NextResponse.json({ error: "Ja existe trabalhador cadastrado com este e-mail." }, { status: 409 });
      }
      const worker = await dbQueryOne<{ id: string; nome: string; email: string }>(
        `INSERT INTO cj_job_workers (nome, email, senha_hash, telefone, cidade, nivel, disponibilidade, onboarding_concluido, ativo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true,true)
         RETURNING id, nome, email`,
        [nome, email, hash, telefone || null, cidade || null, nivel, disponibilidade || null]
      );
      if (!worker) throw new Error("Falha ao criar trabalhador.");
      const token = await signJobSession({ id: worker.id, nome: worker.nome, email: worker.email, perfil: "worker" });
      await setJobSessionCookie(token);
      return NextResponse.json({ ok: true, redirectTo: "/profissionais/painel" });
    }

    const responsavel = String(body.responsavel_nome || "").trim();
    const bairro = String(body.bairro || "").trim();
    const uf = String(body.uf || "").trim();
    const endereco = String(body.endereco || "").trim();
    const totalUnidades = Number(body.total_unidades || 0) || null;
    const tipo = String(body.tipo || "empresa").trim() || "empresa";

    const existente = await dbQueryOne<{ id: string }>(
      `SELECT id FROM cj_job_condos WHERE LOWER(email) = $1`,
      [email]
    );
    if (existente) {
      return NextResponse.json({ error: "Ja existe empresa cadastrada com este e-mail." }, { status: 409 });
    }
    const company = await dbQueryOne<{ id: string; nome: string; email: string }>(
      `INSERT INTO cj_job_condos (nome, responsavel_nome, email, senha_hash, telefone, cidade, bairro, uf, endereco, total_unidades, tipo, premium, ativo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,true)
       RETURNING id, nome, email`,
      [nome, responsavel || null, email, hash, telefone || null, cidade || null, bairro || null, uf || null, endereco || null, totalUnidades, tipo]
    );
    if (!company) throw new Error("Falha ao criar empresa.");
    const token = await signJobSession({ id: company.id, nome: company.nome, email: company.email, perfil: "company" });
    await setJobSessionCookie(token);
    return NextResponse.json({ ok: true, redirectTo: "/empresas/painel" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
