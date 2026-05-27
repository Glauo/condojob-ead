import type { Metadata } from "next";
import { SalesLanding } from "@/components/sales-landing";

export const metadata: Metadata = {
  title: "Matricula CondoJob Educacional | Curso R$ 99,00",
  description: "Landing page de venda do curso CondoJob Educacional por R$ 99,00 ou 12x de R$ 9,90.",
};

export default function LpPage() {
  return <SalesLanding />;
}
