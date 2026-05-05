"use client";

import { useState, useRef, useEffect } from "react";

type Material = { nome: string; url: string };
type Questao = { texto: string; alternativas?: string[]; resposta_correta?: number };
type Atividade = { id: string; titulo: string; tipo: string; questoes: Questao[] };

export function PlayerClient({
  aulaId,
  videoUrl,
  conteudo,
  materiais,
  progressoInicial,
  jaConcluido,
  atividades,
  notaMinima,
  userId,
}: {
  aulaId: string;
  videoUrl: string | null;
  conteudo: string | null;
  materiais: Material[];
  progressoInicial: number;
  jaConcluido: boolean;
  atividades: Atividade[];
  notaMinima: number;
  userId: string;
}) {
  const [pct, setPct] = useState(progressoInicial);
  const [videoConcluido, setVideoConcluido] = useState(jaConcluido || progressoInicial >= 100);
  const [tab, setTab] = useState<"video" | "atividades">("video");
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<{ nota: number; msg: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [anotacao, setAnotacao] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (jaConcluido) setPct(100);
  }, [jaConcluido]);

  async function salvarProgresso(percentual: number) {
    if (saved.current && percentual < 100) return;
    await fetch(`/api/progresso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aula_id: aulaId, percentual, concluido: percentual >= 100 }),
    });
    if (percentual >= 100) saved.current = true;
  }

  function simularProgresso() {
    if (videoConcluido) return;
    let p = pct;
    const interval = setInterval(async () => {
      p += 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setVideoConcluido(true);
        await salvarProgresso(100);
      }
      setPct(p);
      if (p % 25 === 0 && p < 100) await salvarProgresso(p);
    }, 800);
  }

  function getYouTubeId(url: string) {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&\s]+)/);
    return m ? m[1] : null;
  }

  async function submeterAtividades() {
    const total = atividades.filter((a) => a.tipo === "multipla_escolha" || a.tipo === "verdadeiro_falso");
    if (total.length === 0) return;
    let acertos = 0;
    total.forEach((a) => {
      if (respostas[a.id] === a.questoes[0]?.resposta_correta) acertos++;
    });
    const nota = Math.round((acertos / total.length) * 10 * 10) / 10;
    setSalvando(true);
    await fetch("/api/atividades/submeter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ atividade_ids: total.map((a) => a.id), respostas, nota, aula_id: aulaId }),
    });
    setSalvando(false);
    setResultado({
      nota,
      msg: nota >= notaMinima
        ? `Parabéns! Nota ${nota.toFixed(1)} — próxima aula desbloqueada!`
        : `Nota ${nota.toFixed(1)} — abaixo do mínimo (${notaMinima}). Tente novamente.`,
    });
  }

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Player */}
      <div className="card">
        <div className="card-body">
          {videoUrl ? (
            <div>
              <div className="player-wrap">
                {ytId ? (
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Aula"
                  />
                ) : (
                  <video
                    controls
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      const p = Math.round((v.currentTime / v.duration) * 100);
                      if (p > pct) {
                        setPct(p);
                        if (p >= 100) { setVideoConcluido(true); salvarProgresso(100); }
                        else if (p % 25 === 0) salvarProgresso(p);
                      }
                    }}
                    onEnded={() => { setVideoConcluido(true); salvarProgresso(100); }}
                    src={videoUrl}
                  />
                )}
              </div>

              {/* Progress */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--cj-text-muted)", marginBottom: "6px" }}>
                  <span>Progresso do vídeo</span>
                  <span style={{ color: videoConcluido ? "var(--cj-teal)" : "var(--cj-text-muted)" }}>{videoConcluido ? "✓ Concluído" : `${pct}%`}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className={`progress-bar-fill ${videoConcluido ? "progress-bar-fill-success" : ""}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Simular botão (YouTube não permite rastreamento nativo) */}
              {ytId && !videoConcluido && (
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
                  <button className="btn btn-ghost btn-sm" onClick={simularProgresso}>
                    ▶ Marcar progresso manualmente
                  </button>
                  <span style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)" }}>
                    (Assista o vídeo completamente e depois clique)
                  </span>
                </div>
              )}

              {videoConcluido && atividades.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setTab("atividades")}
                    style={{ background: "var(--cj-teal)" }}
                  >
                    Ir para Atividades →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="player-overlay" style={{ position: "relative", minHeight: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="40" height="40" style={{ color: "var(--cj-text-muted)" }}>
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.875rem" }}>Vídeo não disponível para esta aula.</p>
              {!videoConcluido && <button className="btn btn-primary btn-sm" onClick={() => { setVideoConcluido(true); salvarProgresso(100); setPct(100); }}>Marcar aula como concluída</button>}
            </div>
          )}
        </div>
      </div>

      {/* Tabs: Conteúdo / Atividades */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--cj-dark-border)", paddingBottom: "0" }}>
        {(["video", "atividades"] as const).map((t) => (
          <button
            key={t}
            className="btn btn-ghost btn-sm"
            onClick={() => setTab(t)}
            style={{
              borderBottom: tab === t ? "2px solid var(--cj-teal)" : "2px solid transparent",
              borderRadius: "0",
              color: tab === t ? "var(--cj-teal)" : "var(--cj-text-muted)",
              paddingBottom: "10px",
            }}
          >
            {t === "video" ? "Conteúdo & Materiais" : `Atividades (${atividades.length})`}
          </button>
        ))}
      </div>

      {tab === "video" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Conteúdo */}
          {conteudo && (
            <div className="card">
              <div className="card-header"><div><div className="section-eyebrow">Material</div><h3 className="section-title">Conteúdo da aula</h3></div></div>
              <div className="card-body" style={{ color: "var(--cj-text-secondary)", fontSize: "0.9rem", lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{ __html: conteudo }}
              />
            </div>
          )}

          {/* Materiais */}
          {materiais.length > 0 && (
            <div className="card">
              <div className="card-header"><div><div className="section-eyebrow">Downloads</div><h3 className="section-title">Materiais de apoio</h3></div></div>
              <div className="card-body" style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {materiais.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                    <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    {m.nome}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Anotações */}
          <div className="card">
            <div className="card-header"><div><div className="section-eyebrow">Pessoal</div><h3 className="section-title">Minhas anotações</h3></div></div>
            <div className="card-body">
              <textarea
                className="form-input form-textarea"
                style={{ minHeight: "120px", width: "100%" }}
                placeholder="Escreva suas notas pessoais aqui… salvo automaticamente."
                value={anotacao}
                onChange={(e) => setAnotacao(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {tab === "atividades" && (
        <div>
          {!videoConcluido ? (
            <div className="card">
              <div className="card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🔒</div>
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>Assista 100% do vídeo primeiro</div>
                <p style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>As atividades ficam disponíveis após concluir o vídeo da aula.</p>
                <div style={{ marginTop: "16px" }}>
                  <div className="progress-bar-wrap" style={{ maxWidth: "200px", margin: "0 auto" }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "4px" }}>{pct}% assistido</div>
                </div>
              </div>
            </div>
          ) : atividades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Sem atividades</div>
              <p className="empty-desc">Esta aula não possui atividades avaliativas.</p>
            </div>
          ) : (
            <div className="quiz-wrap">
              {resultado ? (
                <div className="card" style={{ borderColor: resultado.nota >= notaMinima ? "rgba(39,174,96,0.4)" : "rgba(231,76,60,0.4)" }}>
                  <div className="card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{resultado.nota >= notaMinima ? "🎉" : "😕"}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: resultado.nota >= notaMinima ? "var(--cj-success)" : "var(--cj-danger)", marginBottom: "8px" }}>
                      {resultado.nota.toFixed(1)}
                    </div>
                    <p style={{ color: "var(--cj-text-secondary)" }}>{resultado.msg}</p>
                    {resultado.nota < notaMinima && (
                      <button className="btn btn-purple" style={{ marginTop: "16px" }} onClick={() => { setResultado(null); setRespostas({}); }}>
                        Tentar novamente
                      </button>
                    )}
                    {resultado.nota >= notaMinima && (
                      <a href={`/aluno/curso/${aulaId}`} className="btn btn-primary" style={{ marginTop: "16px" }}>
                        Continuar curso →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {atividades.map((atv, idx) => (
                    <div className="quiz-question" key={atv.id}>
                      <div className="quiz-question-num">Questão {idx + 1} — {atv.titulo}</div>
                      {atv.questoes.map((q, qi) => (
                        <div key={qi}>
                          <div className="quiz-question-text">{q.texto}</div>
                          {(atv.tipo === "multipla_escolha" || atv.tipo === "verdadeiro_falso") && q.alternativas && (
                            <div className="quiz-options">
                              {q.alternativas.map((alt, ai) => (
                                <div
                                  key={ai}
                                  className={`quiz-option ${respostas[atv.id] === ai ? "selected" : ""}`}
                                  onClick={() => setRespostas((p) => ({ ...p, [atv.id]: ai }))}
                                >
                                  <div className="quiz-radio">
                                    {respostas[atv.id] === ai && <div className="quiz-radio-dot" />}
                                  </div>
                                  {alt}
                                </div>
                              ))}
                            </div>
                          )}
                          {atv.tipo === "dissertativa" && (
                            <textarea className="form-input form-textarea" placeholder="Escreva sua resposta aqui…" style={{ marginTop: "8px", width: "100%" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button className="btn btn-primary btn-lg" onClick={submeterAtividades} disabled={salvando}>
                      {salvando ? "Enviando…" : "Enviar respostas"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
