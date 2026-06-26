import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initSchema, dbQueryOne } from "@/lib/db";
import { signJobSession, setJobSessionCookie, clearJobSessionCookie } from "@/lib/job-auth";

type WorkerUser = { id: string; nome: string; email: string; senha_hash: string };
type CompanyUser = { id: string; nome: string; email: string; senha_hash: string };

async function senhaConfere(senha: string, hash: string) {
  if (await bcrypt.compare(senha, hash)) return true;
  const senhaTrim = senha.trim();
  return senhaTrim !== senha ? bcrypt.compare(senhaTrim, hash) : false;
}

export async function POST(req: NextRequest) {
  try {
    await initSchema();
    const { email, senha, perfil } = await req.json();
    const emailLimpo = String(email || "").toLowerCase().trim();
    const senhaInformada = String(senha || "");
    const perfilLimpo = perfil === "company" ? "company" : "worker";

    if (!emailLimpo || !senhaInformada) {
      return NextResponse.json({ error: "E-mail e senha sao obrigatorios." }, { status: 400 });
    }

    if (perfilLimpo === "worker") {
      const worker = await dbQueryOne<WorkerUser>(
        `SELECT id, nome, email, senha_hash
           FROM cj_job_workers
          WHERE ativo = true
            AND LOWER(email) = $1
            AND senha_hash IS NOT NULL`,
        [emailLimpo]
      );
      if (!worker || !(await senhaConfere(senhaInformada, worker.senha_hash))) {
        return NextResponse.json({ error: "Login do trabalhador invalido." }, { status: 401 });
      }
      const token = await signJobSession({ id: worker.id, nome: worker.nome, email: worker.email, perfil: "worker" });
      await setJobSessionCookie(token);
      return NextResponse.json({ ok: true, perfil: "worker", redirectTo: "/profissionais/painel" });
    }

    const company = await dbQueryOne<CompanyUser>(
      `SELECT id, nome, email, senha_hash
         FROM cj_job_condos
        WHERE ativo = true
          AND LOWER(email) = $1
          AND senha_hash IS NOT NULL`,
      [emailLimpo]
    );
    if (!company || !(await senhaConfere(senhaInformada, company.senha_hash))) {
      return NextResponse.json({ error: "Login da empresa invalido." }, { status: 401 });
    }

    const token = await signJobSession({ id: company.id, nome: company.nome, email: company.email, perfil: "company" });
    await setJobSessionCookie(token);
    return NextResponse.json({ ok: true, perfil: "company", redirectTo: "/empresas/painel" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearJobSessionCookie();
  return NextResponse.json({ ok: true });
}
