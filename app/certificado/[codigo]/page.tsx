import { notFound } from "next/navigation";
import { dbQueryOne, initSchema } from "@/lib/db";
import { PrintCertificateButton } from "@/components/print-certificate-button";

type Cert = {
  codigo: string;
  emitido_em: string;
  nome: string;
  nome_curso: string;
  carga_horaria: number;
};

export default async function CertificadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  await initSchema();
  const cert = await dbQueryOne<Cert>(
    `SELECT ce.codigo, ce.emitido_em, u.nome, c.nome AS nome_curso, c.carga_horaria
       FROM cj_certificados ce
       JOIN cj_users u ON u.id = ce.usuario_id
       JOIN cj_cursos c ON c.id = ce.curso_id
      WHERE ce.codigo = $1`,
    [codigo]
  );
  if (!cert) notFound();

  return (
    <main className="public-cert-page">
      <section className="public-cert-card">
        <div className="public-cert-kicker">CondoJob Educacional</div>
        <h1>Certificado de Conclusão</h1>
        <p className="public-cert-intro">Certificamos que</p>
        <div className="public-cert-name">{cert.nome}</div>
        <p className="public-cert-desc">
          concluiu com aprovação o curso <strong>{cert.nome_curso}</strong>, com carga horária de{" "}
          <strong>{cert.carga_horaria} horas</strong>.
        </p>
        <div className="public-cert-meta">
          <span>Emitido em {new Date(cert.emitido_em).toLocaleDateString("pt-BR")}</span>
          <span>Código: {cert.codigo}</span>
        </div>
        <div className="public-cert-actions">
          <PrintCertificateButton />
          <a href="/login" className="btn btn-ghost">Acessar plataforma</a>
        </div>
      </section>
    </main>
  );
}
