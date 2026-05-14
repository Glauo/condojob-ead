import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { dbQuery, dbQueryOne, initSchema } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

type Beneficio = {
  id: string;
  nome_empresa: string;
  categoria: string;
  descricao: string | null;
  desconto: string;
  cupom: string | null;
  link_url: string | null;
  contato: string | null;
  endereco: string | null;
  regras: string | null;
};

async function hasPremiumAccess(userId: string) {
  const row = await dbQueryOne<{ ok: boolean }>(
    `SELECT true AS ok
       FROM cj_matriculas m
       JOIN cj_cursos c ON c.id = m.curso_id
      WHERE m.usuario_id=$1
        AND m.status IN ('ativo','concluido')
        AND (c.preco > 0 OR c.nome ILIKE '%premium%')
      LIMIT 1`,
    [userId]
  );
  return Boolean(row?.ok);
}

export default async function AlunoClubCondoJobPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.perfil !== "aluno") redirect("/coordenador");

  await initSchema();
  const acessoPremium = await hasPremiumAccess(session.id);

  const beneficios = acessoPremium
    ? await dbQuery<Beneficio>(
      `SELECT id, nome_empresa, categoria, descricao, desconto, cupom, link_url, contato, endereco, regras
         FROM cj_club_beneficios
        WHERE ativo = true
        ORDER BY categoria, nome_empresa`
    )
    : [];

  const categorias = Array.from(new Set(beneficios.map((b) => b.categoria)));

  return (
    <AppShell breadcrumb="ClubCondoJob" userName={session.nome} userRole="aluno">
      <div className="page-header">
        <div>
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />Clube de descontos</div>
          <h1 className="page-title">ClubCondoJob</h1>
          <p className="page-desc">Beneficios exclusivos para alunos do curso premium CondoJob.</p>
        </div>
      </div>

      {!acessoPremium ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-title">Clube exclusivo para alunos premium</div>
              <p className="empty-desc">
                Ao realizar um curso premium, os descontos em lojas, servicos e empresas parceiras ficam disponiveis aqui.
              </p>
              <a href="/aluno/cursos" className="btn btn-primary">Ver meus cursos</a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="metric-grid metric-grid-3">
            <div className="metric-card metric-card-purple">
              <div className="metric-label">Beneficios ativos</div>
              <div className="metric-value">{beneficios.length}</div>
            </div>
            <div className="metric-card metric-card-teal">
              <div className="metric-label">Categorias</div>
              <div className="metric-value">{categorias.length}</div>
            </div>
            <div className="metric-card metric-card-green">
              <div className="metric-label">Acesso</div>
              <div className="metric-value">Premium</div>
              <div className="metric-note">Liberado para seu cadastro</div>
            </div>
          </div>

          {beneficios.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-title">Nenhum desconto disponivel</div>
                  <p className="empty-desc">Novos parceiros serao adicionados pela coordenacao.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="content-grid">
              {categorias.map((categoria) => (
                <div className="card" key={categoria}>
                  <div className="card-header">
                    <div>
                      <div className="section-eyebrow">Categoria</div>
                      <h3 className="section-title">{categoria}</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="course-grid">
                      {beneficios.filter((b) => b.categoria === categoria).map((b) => (
                        <div className="course-card" key={b.id}>
                          <div className="course-card-body">
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-start" }}>
                              <div>
                                <div className="course-card-num">{b.categoria}</div>
                                <div className="course-card-title">{b.nome_empresa}</div>
                              </div>
                              <span className="badge badge-success">{b.desconto}</span>
                            </div>
                            {b.descricao && (
                              <p style={{ color: "var(--cj-text-secondary)", fontSize: "0.84rem", marginTop: "10px" }}>
                                {b.descricao}
                              </p>
                            )}
                            <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
                              {b.cupom && (
                                <div className="accordion-material-item" style={{ marginBottom: 0 }}>
                                  <span style={{ color: "var(--cj-text-muted)" }}>Cupom</span>
                                  <strong style={{ marginLeft: "auto" }}>{b.cupom}</strong>
                                </div>
                              )}
                              {b.contato && <div className="text-sm text-muted">Contato: {b.contato}</div>}
                              {b.endereco && <div className="text-sm text-muted">Endereco: {b.endereco}</div>}
                              {b.regras && <div className="text-xs text-muted">Regras: {b.regras}</div>}
                            </div>
                            {b.link_url && (
                              <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: "16px" }}>
                                Acessar desconto
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
