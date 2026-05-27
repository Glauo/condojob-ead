import type { Metadata } from "next";
import { SalesLanding } from "@/components/sales-landing";

export const metadata: Metadata = {
  title: "Curso de Assistente Condominial | CondoJob Educacional",
  description: "Formacao online para assistente condominial por R$ 99,00 ou 12x de R$ 9,90.",
};

export default function CursoAssistenteCondominialPage() {
  return <SalesLanding />;
}
