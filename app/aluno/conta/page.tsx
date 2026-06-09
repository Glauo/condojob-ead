import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AlunoContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  return (
    <AppShell breadcrumb="Minha conta" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Conta</div>
          <h1 className="page-title">Minha conta</h1>
          <p className="page-desc">Gerencie sua senha de acesso ao painel CondoJob Educacional.</p>
        </div>
      </div>

      <ChangePasswordForm />
    </AppShell>
  );
}
