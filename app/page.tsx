import type { Metadata } from "next";
import { HomeLanding } from "@/components/home-landing";

export const metadata: Metadata = {
  title: "CondoJob Educacional | Pagina inicial",
  description: "Pagina inicial da CondoJob Educacional com acesso destacado para cadastro e entrada na plataforma EAD.",
};

export default function LandingPage() {
  return <HomeLanding />;
}
