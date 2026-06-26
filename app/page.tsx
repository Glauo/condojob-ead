import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";

export const metadata: Metadata = {
  title: "CondoJob | Plataforma principal",
  description: "Pagina principal da CondoJob com acesso a login, cadastro, plataforma comercial e CondoJob EAD.",
};

export default function LandingPage() {
  return <HomeLanding />;
}
