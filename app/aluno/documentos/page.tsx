import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { EnviarDocumentoBtn } from "@/components/documento-modal";

type Doc = { id: string; tipo: string; nome_arquivo: string; status: string; criado_em: string; enviado_por: string; observacoes: string | null; arquivo_url: string | null };

const STATUS_BADGE: Record<string, string> = { pendente: "badge-warning", aprovado: "badge-success", rejeitado: "badge-danger" };

export default async function DocumentosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();

  const docs = await dbQuery<Doc>(
    "SELECT id, tipo, nome_arquivo, status, criado_em, enviado_por, observacoes, arquivo_url FROM cj_documentos WHERE usuario_id=$1 ORDER BY criado_em DESC",
    [session.id]
  );

  const pendentes = docs.filter((d) => d.status === "pendente" && d.enviado_por === "aluno").length;
  const aprovados = docs.filter((d) => d.status === "aprovado").length;

  return (
    <AppShell breadcrumb="Documentos" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Documentos</div>
          <h1 className="page-title">Meus Documentos</h1>
          <p className="page-desc">Envie e acompanhe seus documentos.</p>
        </div>
        <div className="page-actions">
          <EnviarDocumentoBtn />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total</div>
          <div className="metric-value">{docs.length}</div>
        </div>
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Em análise</div>
          <div className="metric-value">{pendentes}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Aprovados</div>
          <div className="metric-value">{aprovados}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingTop: "8px" }}>
          {docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
              </div>
              <div className="empty-title">Nenhum documento</div>
              <p className="empty-desc">Envie documentos usando o botão "Enviar Documento".</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Documento</th><th>Tipo</th><th>Enviado em</th><th>Status</th><th>Observações</th><th>Arquivo</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.nome_arquivo || "—"}</td>
                    <td><span className="badge badge-purple">{d.tipo}</span></td>
                    <td style={{ fontSize: "0.8rem" }}>{new Date(d.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td><span className={`badge ${STATUS_BADGE[d.status] || "badge-muted"}`}>{d.status}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)", maxWidth: "200px" }}>{d.observacoes || "—"}</td>
                    <td>
                      {d.arquivo_url
                        ? <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Abrir</a>
                        : <span className="text-muted text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
