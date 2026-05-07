"use client";

import { useState } from "react";

type Curso = { id: string; nome: string };
type Aula = { id: string; titulo: string; ordem: number; video_url: string | null; curso_id: string; curso_nome: string };

export function AulasManager({ cursos, aulasIniciais }: { cursos: Curso[]; aulasIniciais: Aula[] }) {
  const [aulas, setAulas] = useState<Aula[]>(aulasIniciais);
  const [editando, setEditando] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [novaAula, setNovaAula] = useState<{ curso_id: string; titulo: string; ordem: number } | null>(null);
  const [cursoAberto, setCursoAberto] = useState<string | null>(cursos[0]?.id ?? null);

  const comVideo = aulas.filter((a) => a.video_url).length;
  const semVideo = aulas.length - comVideo;

  async function salvarVideo(aula: Aula) {
    setSalvando(true);
    const body = { id: aula.id, titulo: aula.titulo, ordem: aula.ordem, video_url: videoUrl.trim() || null };
    await fetch("/api/aulas", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setAulas((prev) => prev.map((a) => a.id === aula.id ? { ...a, video_url: videoUrl.trim() || null } : a));
    setSalvando(false);
    setEditando(null);
  }

  async function criarAula() {
    if (!novaAula || !novaAula.titulo.trim()) return;
    setSalvando(true);
    const res = await fetch("/api/aulas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curso_id: novaAula.curso_id, titulo: novaAula.titulo, ordem: novaAula.ordem }),
    });
    const nova = await res.json();
    const curso = cursos.find((c) => c.id === novaAula.curso_id);
    setAulas((prev) => [...prev, { ...nova, titulo: novaAula.titulo, ordem: novaAula.ordem, video_url: null, curso_id: novaAula.curso_id, curso_nome: curso?.nome ?? "" }]);
    setSalvando(false);
    setNovaAula(null);
  }

  async function excluirAula(id: string) {
    if (!confirm("Excluir esta aula? O progresso dos alunos será perdido.")) return;
    await fetch(`/api/aulas?id=${id}`, { method: "DELETE" });
    setAulas((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Métricas */}
      <div className="metric-grid metric-grid-3">
        <div className="metric-card metric-card-purple">
          <div className="metric-label">Total de aulas</div>
          <div className="metric-value">{aulas.length}</div>
          <div className="metric-note">em {cursos.length} cursos</div>
        </div>
        <div className="metric-card metric-card-teal">
          <div className="metric-label">Com vídeo</div>
          <div className="metric-value">{comVideo}</div>
          <div className="metric-note">vídeos configurados</div>
        </div>
        <div className="metric-card" style={{ borderColor: semVideo > 0 ? "rgba(231,76,60,0.3)" : undefined }}>
          <div className="metric-label">Sem vídeo</div>
          <div className="metric-value" style={{ color: semVideo > 0 ? "var(--cj-danger)" : "var(--cj-success)" }}>{semVideo}</div>
          <div className="metric-note">aguardando upload</div>
        </div>
      </div>

      {/* Cursos e aulas */}
      {cursos.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-title">Nenhum curso criado</div>
              <p className="empty-desc">Crie cursos primeiro em <a href="/coordenador/cursos" style={{ color: "var(--cj-teal)" }}>Cursos</a>.</p>
            </div>
          </div>
        </div>
      ) : (
        cursos.map((curso) => {
          const aulasC = aulas.filter((a) => a.curso_id === curso.id);
          const aberto = cursoAberto === curso.id;
          const proxOrdem = aulasC.length + 1;
          return (
            <div className="card" key={curso.id}>
              {/* Header do curso */}
              <div
                className="card-header"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setCursoAberto(aberto ? null : curso.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <div>
                    <div className="section-eyebrow">Curso</div>
                    <h3 className="section-title">{curso.nome}</h3>
                  </div>
                  <span className="badge badge-purple">{aulasC.length} aulas</span>
                  <span className="badge badge-teal">{aulasC.filter((a) => a.video_url).length} vídeos</span>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"
                  style={{ color: "var(--cj-text-muted)", transform: aberto ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>

              {aberto && (
                <div className="card-body" style={{ paddingTop: "0" }}>
                  {/* Lista de aulas */}
                  {aulasC.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                      {aulasC.map((aula) => (
                        <div key={aula.id} style={{ borderTop: "1px solid var(--cj-dark-border)", padding: "14px 0" }}>
                          {editando === aula.id ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: "50%", background: "var(--cj-purple-bg)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: "0.75rem", fontWeight: 700, color: "var(--cj-purple-light)", flexShrink: 0
                                }}>
                                  {String(aula.ordem).padStart(2, "0")}
                                </div>
                                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{aula.titulo}</div>
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingLeft: "42px" }}>
                                <input
                                  className="form-input"
                                  style={{ flex: 1, fontSize: "0.85rem", padding: "8px 12px" }}
                                  placeholder="https://www.youtube.com/watch?v=... ou URL do vídeo"
                                  value={videoUrl}
                                  onChange={(e) => setVideoUrl(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && salvarVideo(aula)}
                                  autoFocus
                                />
                                <button className="btn btn-primary btn-sm" onClick={() => salvarVideo(aula)} disabled={salvando}>
                                  {salvando ? "…" : "Salvar"}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                              </div>
                              <div style={{ paddingLeft: "42px", fontSize: "0.72rem", color: "var(--cj-text-muted)" }}>
                                Aceita links do YouTube, Vimeo ou URL direta de arquivo de vídeo (mp4, webm)
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: aula.video_url ? "rgba(0,206,209,0.12)" : "rgba(231,76,60,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.75rem", fontWeight: 700,
                                color: aula.video_url ? "var(--cj-teal)" : "var(--cj-danger)", flexShrink: 0
                              }}>
                                {String(aula.ordem).padStart(2, "0")}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{aula.titulo}</div>
                                <div style={{ fontSize: "0.75rem", marginTop: "2px", color: aula.video_url ? "var(--cj-teal)" : "var(--cj-text-muted)" }}>
                                  {aula.video_url ? (
                                    <span>▶ {aula.video_url.length > 60 ? aula.video_url.slice(0, 60) + "…" : aula.video_url}</span>
                                  ) : (
                                    <span>⚠ Sem vídeo configurado</span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => { setEditando(aula.id); setVideoUrl(aula.video_url ?? ""); }}
                                >
                                  {aula.video_url ? "Editar vídeo" : "Adicionar vídeo"}
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: "var(--cj-danger)" }}
                                  onClick={() => excluirAula(aula.id)}
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--cj-text-muted)", fontSize: "0.875rem" }}>
                      Nenhuma aula cadastrada neste curso ainda.
                    </div>
                  )}

                  {/* Adicionar nova aula */}
                  {novaAula?.curso_id === curso.id ? (
                    <div style={{ borderTop: "1px solid var(--cj-dark-border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--cj-teal)" }}>Nova aula — {curso.nome}</div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          className="form-input"
                          type="number"
                          style={{ width: "70px", padding: "8px 10px", fontSize: "0.85rem" }}
                          placeholder="#"
                          value={novaAula.ordem}
                          onChange={(e) => setNovaAula((p) => p ? { ...p, ordem: Number(e.target.value) } : p)}
                        />
                        <input
                          className="form-input"
                          style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                          placeholder="Título da aula"
                          value={novaAula.titulo}
                          onChange={(e) => setNovaAula((p) => p ? { ...p, titulo: e.target.value } : p)}
                          onKeyDown={(e) => e.key === "Enter" && criarAula()}
                          autoFocus
                        />
                        <button className="btn btn-primary btn-sm" onClick={criarAula} disabled={salvando || !novaAula.titulo.trim()}>
                          {salvando ? "…" : "Criar"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setNovaAula(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ borderTop: "1px solid var(--cj-dark-border)", paddingTop: "12px" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--cj-teal)" }}
                        onClick={() => setNovaAula({ curso_id: curso.id, titulo: "", ordem: proxOrdem })}
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Adicionar aula
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
