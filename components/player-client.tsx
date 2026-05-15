"use client";

import { useState, useRef, useEffect } from "react";

type Material = { nome: string; url: string };
type Questao = { texto: string; alternativas?: string[]; resposta_correta?: number };
type Atividade = { id: string; titulo: string; tipo: string; questoes: Questao[] };
type RespostaArquivo = { nome: string; url: string };

export function PlayerClient({
  aulaId,
  cursoId,
  videoUrl,
  conteudo,
  materiais,
  progressoInicial,
  jaConcluido,
  atividades,
  notaMinima,
}: {
  aulaId: string;
  cursoId: string;
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
  const [respostasTexto, setRespostasTexto] = useState<Record<string, string>>({});
  const [respostasArquivo, setRespostasArquivo] = useState<Record<string, RespostaArquivo>>({});
  const [uploadingResposta, setUploadingResposta] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ nota: number | null; msg: string; aguardando?: boolean } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [anotacao, setAnotacao] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (jaConcluido) setPct(100);
  }, [jaConcluido]);

  async function salvarProgresso(percentual: number) {
    if (saved.current && percentual < 100) return;
    await fetch("/api/progresso", {
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

  function protectedVideoUrl(url: string) {
    if (!url.startsWith("/videos/")) return url;
    return `/api/videos/${encodeURIComponent(url.replace("/videos/", ""))}`;
  }

  async function uploadRespostaArquivo(atvId: string, file: File) {
    setUploadingResposta(atvId);
    const fd = new FormData();
    fd.append("resposta", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data as { error?: string }).error || "Erro ao enviar arquivo.");
        return;
      }
      setRespostasArquivo((p) => ({ ...p, [atvId]: { nome: data.nome || file.name, url: data.url } }));
    } finally {
      setUploadingResposta(null);
    }
  }

  async function submeterAtividades() {
    if (!videoConcluido) return;

    const objetivas = atividades.filter((a) => a.tipo === "multipla_escolha" || a.tipo === "verdadeiro_falso");
    const discursivas = atividades.filter((a) => a.tipo === "dissertativa");
    const uploads = atividades.filter((a) => a.tipo === "upload");

    if (objetivas.some((a) => respostas[a.id] === undefined)) {
      alert("Responda todas as questoes objetivas antes de enviar.");
      return;
    }
    if (discursivas.some((a) => !respostasTexto[a.id]?.trim())) {
      alert("Preencha todas as respostas discursivas antes de enviar.");
      return;
    }
    if (uploads.some((a) => !respostasArquivo[a.id]?.url)) {
      alert("Anexe todos os arquivos solicitados antes de enviar.");
      return;
    }

    setSalvando(true);
    const res = await fetch("/api/atividades/submeter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        atividade_ids: atividades.map((a) => a.id),
        respostas: { objetivas: respostas, discursivas: respostasTexto, arquivos: respostasArquivo },
        aula_id: aulaId,
      }),
    });
    setSalvando(false);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((data as { error?: string }).error || "Erro ao enviar avaliacao.");
      return;
    }

    const aguardando = discursivas.length > 0 || uploads.length > 0;
    const notaFinal = typeof (data as { nota?: unknown }).nota === "number" ? (data as { nota: number }).nota : null;
    setResultado({
      nota: notaFinal,
      aguardando,
      msg: aguardando
        ? "Avaliacao enviada. As questoes discursivas ou arquivos ficam aguardando correcao do coordenador."
        : notaFinal !== null && notaFinal >= notaMinima
          ? `Parabens! Nota ${notaFinal.toFixed(1)} - proximo modulo desbloqueado!`
          : `Nota ${notaFinal?.toFixed(1)} - abaixo do minimo (${notaMinima}). Tente novamente.`,
    });
  }

  const ytId = videoUrl ? getYouTubeId(videoUrl) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
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
                    src={protectedVideoUrl(videoUrl)}
                  />
                )}
              </div>

              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--cj-text-muted)", marginBottom: "6px" }}>
                  <span>Progresso do video</span>
                  <span style={{ color: videoConcluido ? "var(--cj-teal)" : "var(--cj-text-muted)" }}>{videoConcluido ? "Concluido" : `${pct}%`}</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className={`progress-bar-fill ${videoConcluido ? "progress-bar-fill-success" : ""}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              {ytId && !videoConcluido && (
                <div style={{ marginTop: "12px", background: "rgba(155,89,182,0.08)", border: "1px solid rgba(155,89,182,0.2)", borderRadius: "var(--cj-radius)", padding: "12px 14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px" }}>Assista o video ate o final</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginBottom: "8px" }}>
                      Depois de assistir completamente, confirme para liberar a avaliacao do modulo.
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={simularProgresso}>
                      Confirmar que assisti o video completo
                    </button>
                  </div>
                </div>
              )}

              {videoConcluido && atividades.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <button className="btn btn-primary" onClick={() => setTab("atividades")} style={{ background: "var(--cj-teal)" }}>
                    Ir para Avaliacao
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="player-overlay" style={{ position: "relative", minHeight: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <p style={{ color: "var(--cj-text-muted)", fontSize: "0.875rem" }}>Video nao disponivel para esta aula.</p>
              {!videoConcluido && <button className="btn btn-primary btn-sm" onClick={() => { setVideoConcluido(true); salvarProgresso(100); setPct(100); }}>Marcar aula como concluida</button>}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--cj-dark-border)" }}>
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
            {t === "video" ? "Conteudo & Materiais" : `Avaliacao (${atividades.length}/10)`}
          </button>
        ))}
      </div>

      {tab === "video" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {conteudo && (
            <div className="card">
              <div className="card-header"><div><div className="section-eyebrow">Material</div><h3 className="section-title">Conteudo da aula</h3></div></div>
              <div className="card-body" style={{ color: "var(--cj-text-secondary)", fontSize: "0.9rem", lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{ __html: conteudo }}
              />
            </div>
          )}

          {materiais.length > 0 && (
            <div className="card">
              <div className="card-header"><div><div className="section-eyebrow">Downloads</div><h3 className="section-title">Materiais de apoio</h3></div></div>
              <div className="card-body" style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {materiais.map((m, i) => (
                  <a key={i} href={m.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>
                    {m.nome}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><div><div className="section-eyebrow">Pessoal</div><h3 className="section-title">Minhas anotacoes</h3></div></div>
            <div className="card-body">
              <textarea
                className="form-input form-textarea"
                style={{ minHeight: "120px", width: "100%" }}
                placeholder="Escreva suas notas pessoais aqui."
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
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>Assista 100% do video primeiro</div>
                <p style={{ fontSize: "0.875rem", color: "var(--cj-text-muted)" }}>A avaliacao deste modulo fica disponivel apos concluir a aula.</p>
              </div>
            </div>
          ) : atividades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Sem avaliacao</div>
              <p className="empty-desc">Este modulo ainda nao possui questoes avaliativas.</p>
            </div>
          ) : resultado ? (
            <div className="card" style={{ borderColor: resultado.aguardando || (resultado.nota !== null && resultado.nota >= notaMinima) ? "rgba(39,174,96,0.4)" : "rgba(231,76,60,0.4)" }}>
              <div className="card-body" style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: resultado.aguardando || (resultado.nota !== null && resultado.nota >= notaMinima) ? "var(--cj-success)" : "var(--cj-danger)", marginBottom: "8px" }}>
                  {resultado.aguardando ? "Aguardando correcao" : resultado.nota?.toFixed(1)}
                </div>
                <p style={{ color: "var(--cj-text-secondary)" }}>{resultado.msg}</p>
                {!resultado.aguardando && resultado.nota !== null && resultado.nota < notaMinima && (
                  <button className="btn btn-purple" style={{ marginTop: "16px" }} onClick={() => { setResultado(null); setRespostas({}); setRespostasTexto({}); setRespostasArquivo({}); }}>
                    Tentar novamente
                  </button>
                )}
                {(resultado.aguardando || (resultado.nota !== null && resultado.nota >= notaMinima)) && (
                  <a href={`/aluno/curso/${cursoId}`} className="btn btn-primary" style={{ marginTop: "16px" }}>
                    Continuar curso
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="quiz-wrap">
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="section-eyebrow">Instrucoes</div>
                    <h3 className="section-title">Como fazer a avaliacao</h3>
                  </div>
                </div>
                <div className="card-body" style={{ color: "var(--cj-text-secondary)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                  <p style={{ marginTop: 0 }}>
                    Este caderno contem 8 avaliacoes, uma para cada modulo do curso. Cada avaliacao tem 10 questoes objetivas de multipla escolha, com 4 alternativas cada.
                  </p>
                  <p>
                    Faca a avaliacao correspondente ao final de cada modulo, em ordem: Modulo 1, depois Modulo 2, e assim por diante.
                  </p>
                  <div style={{ display: "grid", gap: "6px", marginTop: "12px" }}>
                    <div><strong style={{ color: "var(--cj-text)" }}>Tempo sugerido:</strong> 15 a 20 minutos por avaliacao.</div>
                    <div><strong style={{ color: "var(--cj-text)" }}>Aplicacao:</strong> faca individualmente, sem consultar a apostila ou os videos.</div>
                    <div><strong style={{ color: "var(--cj-text)" }}>Marcacao:</strong> marque apenas uma alternativa por questao.</div>
                    <div><strong style={{ color: "var(--cj-text)" }}>Aproveitamento minimo:</strong> 7 acertos em 10 (70%).</div>
                    <div><strong style={{ color: "var(--cj-text)" }}>Revisao:</strong> se errar muitas questoes, revise o conteudo na apostila antes de seguir.</div>
                  </div>
                  <p style={{ marginBottom: 0, marginTop: "12px" }}>
                    Leia cada questao com atencao. Observe palavras-chave como INCORRETO, NAO e EXCETO.
                  </p>
                </div>
              </div>
              {atividades.map((atv, idx) => (
                <div className="quiz-question" key={atv.id}>
                  <div className="quiz-question-num">Questao {idx + 1} de 10 - {atv.titulo}</div>
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
                        <textarea
                          className="form-input form-textarea"
                          placeholder="Escreva sua resposta aqui."
                          style={{ marginTop: "8px", width: "100%" }}
                          value={respostasTexto[atv.id] || ""}
                          onChange={(e) => setRespostasTexto((p) => ({ ...p, [atv.id]: e.target.value }))}
                        />
                      )}
                      {atv.tipo === "upload" && (
                        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <input
                            className="form-input"
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadRespostaArquivo(atv.id, file);
                            }}
                          />
                          {uploadingResposta === atv.id && <span className="badge badge-muted">Enviando...</span>}
                          {respostasArquivo[atv.id] && <span className="badge badge-success">{respostasArquivo[atv.id].nome}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btn-primary btn-lg" onClick={submeterAtividades} disabled={salvando || Boolean(uploadingResposta)}>
                  {salvando ? "Enviando..." : "Enviar avaliacao"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
