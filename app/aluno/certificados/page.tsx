import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Cert = { id: string; codigo: string; emitido_em: string; nome_curso: string; carga_horaria: number };

export default async function CertificadosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const certs = await dbQuery<Cert>(
    `SELECT ce.id, ce.codigo, ce.emitido_em, c.nome AS nome_curso, c.carga_horaria
     FROM cj_certificados ce JOIN cj_cursos c ON c.id = ce.curso_id
     WHERE ce.usuario_id = $1 ORDER BY ce.emitido_em DESC`,
    [session.id]
  );

  return (
    <AppShell breadcrumb="Certificados" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Conquistas</div>
          <h1 className="page-title">Meus Certificados</h1>
          <p className="page-desc">Certificados de conclusão de cursos CondoJob Educacional.</p>
        </div>
      </div>

      {certs.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              <div className="empty-title">Nenhum certificado ainda</div>
              <p className="empty-desc">Complete um curso com nota ≥ 7,0 para receber seu certificado automaticamente.</p>
              <a href="/aluno" className="btn btn-primary">Ver meus cursos</a>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {certs.map((cert) => (
            <div key={cert.id} className="cert-card">
              <div className="cert-icon">🏆</div>
              <div className="cert-title">{cert.nome_curso}</div>
              <div className="cert-name">{session.nome}</div>
              <div className="cert-meta">
                Carga horária: {cert.carga_horaria}h · Emitido em {new Date(cert.emitido_em).toLocaleDateString("pt-BR")}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--cj-text-muted)", marginTop: "8px", fontFamily: "monospace" }}>
                Código: {cert.codigo}
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
                <a href={`/certificado/${cert.codigo}`} target="_blank" className="btn btn-primary btn-sm">
                  Ver certificado
                </a>
                <a href={`/api/certificados?codigo=${cert.codigo}&download=1`} className="btn btn-ghost btn-sm">
                  Baixar PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
