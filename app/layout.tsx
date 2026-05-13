import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CondoJob Educação",
  description: "CondoJob Educação — Formação de profissionais condominiais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
