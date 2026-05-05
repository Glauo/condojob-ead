import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AprovarDocModal } from "@/components/coordenador-doc-modal";

type Doc = { id: string; nome_usuario: string; tipo: string; nome_arquivo: string; status: string; criado_em: string; arquivo_url: string | null; observacoes: string | null };

const STATUS_BADGE: Record<string, string> = { pendente: "badge-warning", aprovado: "badge-success", rejeitado: "badge-danger" };

export default async function CoordDocumentosPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const docs = await dbQuery<Doc>(
    `SELECT d.id, u.nome AS nome_usuario, d.tipo, d.nome_arquivo, d.status, d.criado_em, d.arquivo_url, d.observacoes
     FROM cj_documentos d JOIN cj_users u ON u.id = d.usuario_id
     ORDER BY d.criado_em DESC`
  );

  const pendentes = docs.filter((d) => d.status === "pendente").length;

  return (
    <AppShell breadcrumb="Documentos" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Documentos</div>
          <h1 className="page-title">Documentos dos Alunos</h1>
          <p className="page-desc">Revise, aprove ou rejeite documentos enviados pelos alunos.</p>
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-yellow">
          <div className="metric-label">Pendentes</div>
          <div className="metric-value">{pendentes}</div>
          <div className="metric-note">Aguardando análise</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Aprovados</div>
          <div className="metric-value">{docs.filter((d) => d.status === "aprovado").length}</div>
        </div>
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total recebidos</div>
          <div className="metric-value">{docs.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: "0" }}>
          {docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum documento enviado</div>
              <p className="empty-desc">Os alunos ainda não enviaram documentos.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Aluno</th><th>Tipo</th><th>Arquivo</th><th>Enviado em</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.nome_usuario}</td>
                    <td><span className="badge badge-purple">{d.tipo}</span></td>
                    <td>
                      {d.arquivo_url
                        ? <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">{d.nome_arquivo}</a>
                        : <span style={{ fontSize: "0.82rem" }}>{d.nome_arquivo}</span>}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--cj-text-muted)" }}>{new Date(d.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td><span className={`badge ${STATUS_BADGE[d.status] || "badge-muted"}`}>{d.status}</span></td>
                    <td>
                      {d.status === "pendente" && <AprovarDocModal docId={d.id} nomeArquivo={d.nome_arquivo} />}
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
