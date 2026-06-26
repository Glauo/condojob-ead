import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CondoJob | Plataforma principal",
  description: "Pagina principal da CondoJob com login, cadastro, area do aluno, gestao academica, area comercial e acesso ao CondoJob EAD.",
};

export default function LandingPage() {
  return <HomeLanding />;
}
