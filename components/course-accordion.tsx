"use client";

import { useState } from "react";

type Material = { nome: string; url: string };

type AulaComStatus = {
  id: string;
  titulo: string;
  ordem: number;
  video_url: string | null;
  materiais: Material[];
  percentual: number;
  concluido: boolean;
  unlocked: boolean;
  unlockReason: string | null;
};

type AtvComStatus = {
  id: string;
  aula_id: string;
  titulo: string;
  tipo: string;
  nota: number | null;
  sub_status: string | null;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0, color: "var(--cj-text-muted)" }}>
      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

export function CourseAccordion({
  aulas,
  atividades,
  notaMinima,
}: {
  aulas: AulaComStatus[];
  atividades: AtvComStatus[];
  notaMinima: number;
}) {
  const [openSection, setOpenSection] = useState<string | null>("video");

  const totalMateriais = aulas.reduce((s, a) => s + a.materiais.length, 0);
  const totalAtv = atividades.length;
  const primeiraAulaApresentacao = /apresent/i.test(aulas[0]?.titulo ?? "");
  const totalModulos = primeiraAulaApresentacao ? Math.max(aulas.length - 1, 0) : aulas.length;
  const aprovadas = atividades.filter(
    (a) => a.nota !== null && Number(a.nota) >= notaMinima && a.sub_status === "corrigida"
  ).length;

  function displayModulo(idx: number) {
    if (primeiraAulaApresentacao && idx === 0) return "AP";
    return String(primeiraAulaApresentacao ? idx : idx + 1).padStart(2, "0");
  }

  function toggle(key: string) {
    setOpenSection((prev) => (prev === key ? null : key));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* ── Videoaulas ── */}
      <div className="accordion-section">
        <button className={`accordion-header${openSection === "video" ? " open" : ""}`} onClick={() => toggle("video")}>
          <span className="accordion-section-icon">🎬</span>
          <span className="accordion-section-title">Videoaulas</span>
          <span className="badge badge-purple" style={{ marginLeft: "10px" }}>{totalModulos} módulos</span>
          <ChevronIcon open={openSection === "video"} />
        </button>

        {openSection === "video" && (
          <div className="accordion-body">
            {aulas.length === 0 ? (
              <p className="accordion-empty">Nenhum módulo cadastrado ainda.</p>
            ) : (
              aulas.map((aula, idx) => (
                <div key={aula.id} className="accordion-item">
                  <div className={`accordion-item-num${aula.concluido ? " done" : aula.unlocked ? " active" : ""}`}>
                    {aula.concluido
                      ? <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      : displayModulo(idx)
                    }
                  </div>
                  <div className="accordion-item-content">
                    <div className="accordion-item-title" style={{ color: !aula.unlocked ? "var(--cj-text-muted)" : undefined }}>
                      {aula.titulo}
                    </div>
                    {!aula.unlocked && (
                      <div className="accordion-item-lock">🔒 {aula.unlockReason}</div>
                    )}
                    {aula.unlocked && !aula.concluido && aula.percentual > 0 && (
                      <div style={{ maxWidth: "200px", marginTop: "6px" }}>
                        <div className="progress-bar-wrap" style={{ height: "4px" }}>
                          <div className="progress-bar-fill progress-bar-fill-teal" style={{ width: `${aula.percentual}%` }} />
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>
                          {aula.percentual}% assistido
                        </div>
                      </div>
                    )}
                    {aula.concluido && (
                      <div style={{ fontSize: "0.72rem", color: "var(--cj-success)", marginTop: "2px" }}>✓ Vídeo concluído</div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {aula.unlocked ? (
                      <a href={`/aluno/aula/${aula.id}`} className="btn btn-primary btn-sm">
                        {aula.concluido ? "Rever" : aula.percentual > 0 ? "Continuar" : "Assistir →"}
                      </a>
                    ) : (
                      <span className="badge badge-muted">🔒 Bloqueado</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Materiais de Apoio ── */}
      <div className="accordion-section">
        <button className={`accordion-header${openSection === "material" ? " open" : ""}`} onClick={() => toggle("material")}>
          <span className="accordion-section-icon">📁</span>
          <span className="accordion-section-title">Materiais de Apoio</span>
          <span className="badge badge-teal" style={{ marginLeft: "10px" }}>{totalMateriais} arquivo{totalMateriais !== 1 ? "s" : ""}</span>
          <ChevronIcon open={openSection === "material"} />
        </button>

        {openSection === "material" && (
          <div className="accordion-body">
            {totalMateriais === 0 ? (
              <p className="accordion-empty">Nenhum material disponível ainda.</p>
            ) : (
              aulas.map((aula, idx) =>
                aula.materiais.length > 0 ? (
                  <div key={aula.id} style={{ marginBottom: "16px" }}>
                    <div className="accordion-module-label">
                      {displayModulo(idx) === "AP" ? "Apresentação" : `Módulo ${displayModulo(idx)}`} — {aula.titulo}
                    </div>
                    {aula.materiais.map((m, i) => (
                      <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="accordion-material-item">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ color: "var(--cj-danger)", flexShrink: 0 }}>
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span style={{ flex: 1 }}>{m.nome}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--cj-text-muted)", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: "4px" }}>PDF</span>
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" style={{ color: "var(--cj-teal)" }}>
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    ))}
                  </div>
                ) : null
              )
            )}
          </div>
        )}
      </div>

      {/* ── Atividades Avaliativas ── */}
      <div className="accordion-section">
        <button className={`accordion-header${openSection === "atividade" ? " open" : ""}`} onClick={() => toggle("atividade")}>
          <span className="accordion-section-icon">📝</span>
          <span className="accordion-section-title">Avaliacoes por Modulo</span>
          <span className="badge badge-success" style={{ marginLeft: "10px" }}>{aprovadas}/{totalAtv} aprovadas</span>
          <ChevronIcon open={openSection === "atividade"} />
        </button>

        {openSection === "atividade" && (
          <div className="accordion-body">
            {totalAtv === 0 ? (
              <p className="accordion-empty">Nenhuma atividade avaliativa cadastrada.</p>
            ) : (
              aulas.map((aula, idx) => {
                const atvAula = atividades.filter((a) => a.aula_id === aula.id);
                if (atvAula.length === 0) return null;
                return (
                  <div key={aula.id} style={{ marginBottom: "16px" }}>
                    <div className="accordion-module-label">
                      Módulo {displayModulo(idx)} — {aula.titulo}
                    </div>
                    {atvAula.map((atv) => {
                      const nota = atv.nota !== null ? Number(atv.nota) : null;
                      const aprovada = nota !== null && nota >= notaMinima && atv.sub_status === "corrigida";
                      const reprovada = nota !== null && nota < notaMinima && atv.sub_status === "corrigida";
                      const aguardando = atv.sub_status === "aguardando_correcao";
                      const videoFeito = aula.concluido;

                      return (
                        <div key={atv.id} className="accordion-atv-item">
                          <div className={`accordion-atv-dot${aprovada ? " aprovada" : reprovada ? " reprovada" : aguardando ? " aguardando" : videoFeito ? " disponivel" : " bloqueada"}`} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: "0.875rem", fontWeight: 600,
                              color: !videoFeito ? "var(--cj-text-muted)" : "var(--cj-text)",
                            }}>
                              {atv.titulo}
                            </div>
                            <div style={{ fontSize: "0.72rem", marginTop: "2px", color: "var(--cj-text-muted)" }}>
                              {aprovada ? `Nota: ${nota?.toFixed(1)} — Aprovado ✓` :
                               reprovada ? `Nota: ${nota?.toFixed(1)} — Reprovado. Tente novamente.` :
                               aguardando ? "Aguardando correção do coordenador…" :
                               videoFeito ? "Disponível — clique para realizar" :
                               "Assista o vídeo deste módulo para liberar"}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            {aprovada && <span className="badge badge-success">Aprovado</span>}
                            {reprovada && (
                              <a href={`/aluno/aula/${aula.id}`} className="btn btn-sm btn-ghost" style={{ color: "var(--cj-danger)" }}>
                                Tentar novamente
                              </a>
                            )}
                            {aguardando && <span className="badge badge-warning">Aguardando</span>}
                            {!aprovada && !reprovada && !aguardando && videoFeito && (
                              <a href={`/aluno/aula/${aula.id}`} className="btn btn-primary btn-sm">Realizar →</a>
                            )}
                            {!videoFeito && <span className="badge badge-muted">🔒</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
