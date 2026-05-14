import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { ClubBeneficioModal, type ClubBeneficio } from "@/components/club-beneficio-modal";

type Stats = { total: number; ativos: number; categorias: number };

export default async function CoordClubCondoJobPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "coordenador") redirect("/aluno");

  await initSchema();

  const [beneficios, stats] = await Promise.all([
    dbQuery<ClubBeneficio>(
      `SELECT id, nome_empresa, categoria, descricao, desconto, cupom, link_url, contato,
              endereco, regras, ativo
         FROM cj_club_beneficios
        ORDER BY ativo DESC, categoria, nome_empresa`
    ),
    dbQueryOne<Stats>(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE ativo = true)::int AS ativos,
              COUNT(DISTINCT categoria)::int AS categorias
         FROM cj_club_beneficios`
    ),
  ]);

  const s = stats ?? { total: 0, ativos: 0, categorias: 0 };

  return (
    <AppShell breadcrumb="ClubCondoJob" userName={session.nome} userRole="coordenador">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Clube de descontos</div>
          <h1 className="page-title">ClubCondoJob</h1>
          <p className="page-desc">Cadastre descontos em lojas, servicos e empresas parceiras para alunos premium.</p>
        </div>
        <div className="page-actions">
          <ClubBeneficioModal />
        </div>
      </div>

      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Beneficios cadastrados</div>
          <div className="metric-value">{s.total}</div>
        </div>
        <div className="metric-card metric-card-green">
          <div className="metric-label">Ativos para alunos</div>
          <div className="metric-value">{s.ativos}</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Categorias</div>
          <div className="metric-value">{s.categorias}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="section-eyebrow">Parceiros</div>
            <h3 className="section-title">Descontos cadastrados</h3>
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: "8px" }}>
          {beneficios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nenhum desconto cadastrado</div>
              <p className="empty-desc">Clique em "Novo desconto" para incluir o primeiro parceiro do clube.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Empresa</th><th>Categoria</th><th>Desconto</th><th>Cupom</th><th>Status</th><th>Acoes</th></tr>
              </thead>
              <tbody>
                {beneficios.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="table-name-cell">
                        <span className="table-name-primary">{b.nome_empresa}</span>
                        <span className="table-name-secondary">{b.contato || b.link_url || "Sem contato informado"}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-teal">{b.categoria}</span></td>
                    <td style={{ fontWeight: 800 }}>{b.desconto}</td>
                    <td>{b.cupom ? <span className="badge badge-purple">{b.cupom}</span> : "—"}</td>
                    <td><span className={`badge ${b.ativo ? "badge-success" : "badge-muted"}`}>{b.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td><ClubBeneficioModal beneficio={b} /></td>
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
