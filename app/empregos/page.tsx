import type { Metadata } from "next";
import { JobsPlatformHome } from "@/components/jobs-platform-home";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CondoJob | Plataforma de empregos",
  description: "Plataforma principal de empregos da CondoJob com acesso para profissionais, condominios, administracao e CondoJob EAD.",
};

export default function EmpregosPage() {
  return <JobsPlatformHome />;
}
