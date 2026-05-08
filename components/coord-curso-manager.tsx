"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Material = { nome: string; url: string };

type Aula = {
  id: string;
  titulo: string;
  ordem: number;
  video_url: string | null;
  conteudo: string | null;
  materiais: Material[];
  total_atividades: number;
};

type Atividade = {
  id: string;
  aula_id: string;
  titulo: string;
  tipo: string;
};

type Submissao = {
  id: string;
  aula_titulo: string;
  atividade_titulo: string;
  aluno_nome: string;
  nota: number | null;
  status: string;
  submetido_em: string;
};

const CLOSE_SVG = (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

/* ── Tab: Módulos (vídeos) ── */
function TabModulos({ cursoId, aulas, notaMinima }: { cursoId: string; aulas: Aula[]; notaMinima: number }) {
  const router = useRouter();
  const [list, setList] = useState(aulas);
  const [editId, setEditId] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<"url" | "upload">("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [novaForm, setNovaForm] = useState<{ titulo: string; ordem: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function salvarVideo(aula: Aula) {
    let finalUrl = videoUrl.trim() || null;
    if (videoMode === "upload" && uploadFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("video", uploadFile);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      setUploading(false);
      if (!up.ok) { alert("Erro no upload do vídeo."); return; }
      finalUrl = (await up.json()).url;
    }
    setSaving(true);
    await fetch("/api/aulas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: aula.id, titulo: aula.titulo, ordem: aula.ordem, video_url: finalUrl, conteudo: aula.conteudo, materiais: aula.materiais }),
    });
    setSaving(false);
    setList((p) => p.map((a) => a.id === aula.id ? { ...a, video_url: finalUrl } : a));
    setEditId(null);
    setUploadFile(null);
    setVideoUrl("");
  }

  async function criarAula() {
    if (!novaForm?.titulo.trim()) return;
    setSaving(true);
    const res = await fetch("/api/aulas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ curso_id: cursoId, titulo: novaForm.titulo, ordem: novaForm.ordem }),
    });
    const nova = await res.json();
    setSaving(false);
    setList((p) => [...p, { ...nova, titulo: novaForm.titulo, ordem: novaForm.ordem, video_url: null, conteudo: null, materiais: [], total_atividades: 0 }]);
    setNovaForm(null);
  }

  async function excluir(id: string, titulo: string) {
    if (!confirm(`Excluir o módulo "${titulo}"? O progresso dos alunos será perdido.`)) return;
    await fetch(`/api/aulas?id=${id}`, { method: "DELETE" });
    setList((p) => p.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {list.length === 0 && (
        <div className="empty-state" style={{ padding: "32px" }}>
          <div className="empty-title">Nenhum módulo criado</div>
          <p className="empty-desc">Adicione o primeiro módulo abaixo.</p>
        </div>
      )}

      {list.map((aula) => (
        <div key={aula.id} style={{ borderTop: "1px solid var(--cj-dark-border)", padding: "16px 0" }}>
          {editId === aula.id ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="coord-module-num">{String(aula.ordem).padStart(2, "0")}</div>
                <span style={{ fontWeight: 600 }}>{aula.titulo}</span>
              </div>
              <div style={{ paddingLeft: "42px", display: "flex", gap: "8px" }}>
                <button className={`btn btn-sm ${videoMode === "url" ? "btn-primary" : "btn-ghost"}`} onClick={() => setVideoMode("url")}>🔗 URL</button>
                <button className={`btn btn-sm ${videoMode === "upload" ? "btn-primary" : "btn-ghost"}`} onClick={() => setVideoMode("upload")}>⬆ Upload</button>
              </div>
              <div style={{ paddingLeft: "42px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {videoMode === "url" ? (
                  <input className="form-input" placeholder="https://youtube.com/... ou URL .mp4"
                    value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && salvarVideo(aula)} autoFocus />
                ) : (
                  <div className="upload-drop-zone" onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/ogg"
                      style={{ display: "none" }} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                    {uploadFile
                      ? <span style={{ color: "var(--cj-teal)", fontWeight: 600, fontSize: "0.875rem" }}>🎬 {uploadFile.name}</span>
                      : <span style={{ color: "var(--cj-text-muted)", fontSize: "0.875rem" }}>📹 Clique para selecionar vídeo (MP4, WebM · máx 500 MB)</span>
                    }
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-primary btn-sm" onClick={() => salvarVideo(aula)} disabled={saving || uploading}>
                    {uploading ? "Enviando…" : saving ? "…" : "Salvar vídeo"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setUploadFile(null); setVideoUrl(""); }}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div className={`coord-module-num${aula.video_url ? " has-video" : " no-video"}`}>
                {String(aula.ordem).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{aula.titulo}</div>
                <div style={{ fontSize: "0.75rem", marginTop: "2px", color: aula.video_url ? "var(--cj-teal)" : "var(--cj-danger)" }}>
                  {aula.video_url ? `▶ ${aula.video_url.length > 55 ? aula.video_url.slice(0, 55) + "…" : aula.video_url}` : "⚠ Sem vídeo"}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>
                  {aula.total_atividades} atividade{aula.total_atividades !== 1 ? "s" : ""} · {aula.materiais.length} material{aula.materiais.length !== 1 ? "is" : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(aula.id); setVideoUrl(aula.video_url ?? ""); setVideoMode("url"); }}>
                  {aula.video_url ? "Trocar vídeo" : "Adicionar vídeo"}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--cj-danger)" }} onClick={() => excluir(aula.id, aula.titulo)}>
                  Excluir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Nova aula */}
      <div style={{ borderTop: "1px solid var(--cj-dark-border)", paddingTop: "14px" }}>
        {novaForm ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input className="form-input" type="number" min="1" max="10" style={{ width: "70px" }}
              value={novaForm.ordem} onChange={(e) => setNovaForm((p) => p ? { ...p, ordem: Number(e.target.value) } : p)} />
            <input className="form-input" style={{ flex: 1 }} placeholder="Título do módulo"
              value={novaForm.titulo} onChange={(e) => setNovaForm((p) => p ? { ...p, titulo: e.target.value } : p)}
              onKeyDown={(e) => e.key === "Enter" && criarAula()} autoFocus />
            <button className="btn btn-primary btn-sm" onClick={criarAula} disabled={saving || !novaForm.titulo.trim()}>
              {saving ? "…" : "Criar"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setNovaForm(null)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--cj-teal)" }}
            onClick={() => setNovaForm({ titulo: "", ordem: list.length + 1 })}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adicionar módulo
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Tab: Materiais (PDFs) ── */
function TabMateriais({ aulas }: { aulas: Aula[] }) {
  const [list, setList] = useState(aulas);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function uploadPdf(aula: Aula, file: File) {
    setUploadingId(aula.id);
    const fd = new FormData();
    fd.append("arquivo", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    setUploadingId(null);
    if (!up.ok) { alert("Erro no upload do PDF."); return; }
    const { url, nome } = await up.json();
    const novosMateriais = [...aula.materiais, { nome: nome || file.name, url }];
    await fetch("/api/aulas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: aula.id, titulo: aula.titulo, ordem: aula.ordem, video_url: aula.video_url, conteudo: aula.conteudo, materiais: novosMateriais }),
    });
    setList((p) => p.map((a) => a.id === aula.id ? { ...a, materiais: novosMateriais } : a));
  }

  async function removerMaterial(aula: Aula, idx: number) {
    const novosMateriais = aula.materiais.filter((_, i) => i !== idx);
    await fetch("/api/aulas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: aula.id, titulo: aula.titulo, ordem: aula.ordem, video_url: aula.video_url, conteudo: aula.conteudo, materiais: novosMateriais }),
    });
    setList((p) => p.map((a) => a.id === aula.id ? { ...a, materiais: novosMateriais } : a));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {list.map((aula) => (
        <div key={aula.id}>
          <div className="coord-tab-module-header">
            <span className="coord-module-num">{String(aula.ordem).padStart(2, "0")}</span>
            <span style={{ fontWeight: 600 }}>{aula.titulo}</span>
            <span className="badge badge-muted">{aula.materiais.length} PDF{aula.materiais.length !== 1 ? "s" : ""}</span>
          </div>
          {aula.materiais.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ color: "var(--cj-danger)", flexShrink: 0 }}>
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "0.875rem", color: "var(--cj-text)", textDecoration: "underline", textDecorationColor: "rgba(139,92,246,0.3)" }}>
                {m.nome}
              </a>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--cj-danger)", padding: "4px 8px" }}
                onClick={() => removerMaterial(aula, i)}>
                Remover
              </button>
            </div>
          ))}
          <div style={{ marginTop: "10px" }}>
            <input
              ref={(el) => { fileRefs.current[aula.id] = el; }}
              type="file" accept="application/pdf" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(aula, f); }}
            />
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--cj-teal)" }}
              disabled={uploadingId === aula.id}
              onClick={() => fileRefs.current[aula.id]?.click()}
            >
              {uploadingId === aula.id ? "Enviando PDF…" : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Adicionar PDF
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tab: Avaliações ── */
function TabAvaliacoes({ aulas, atividades: atvsIniciais }: { aulas: Aula[]; atividades: Atividade[] }) {
  const router = useRouter();
  const [atvs, setAtvs] = useState(atvsIniciais);
  const [modal, setModal] = useState<{ aulaId: string; aulaTitle: string } | null>(null);
  const [form, setForm] = useState({ titulo: "", tipo: "multipla_escolha", questao_texto: "", alt_a: "", alt_b: "", alt_c: "", alt_d: "", resposta: "0" });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function criarAtividade() {
    if (!modal || !form.titulo.trim() || !form.questao_texto.trim()) { setErro("Preencha título e enunciado."); return; }
    const questoes = [{
      texto: form.questao_texto,
      alternativas: form.tipo === "multipla_escolha"
        ? [form.alt_a, form.alt_b, form.alt_c, form.alt_d].filter(Boolean)
        : form.tipo === "verdadeiro_falso" ? ["Verdadeiro", "Falso"] : undefined,
      resposta_correta: (form.tipo === "multipla_escolha" || form.tipo === "verdadeiro_falso") ? Number(form.resposta) : undefined,
    }];
    setSaving(true);
    const res = await fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aula_id: modal.aulaId, titulo: form.titulo, tipo: form.tipo, questoes }),
    });
    setSaving(false);
    if (!res.ok) { setErro("Erro ao criar atividade."); return; }
    const nova = await res.json();
    setAtvs((p) => [...p, { id: nova.id, aula_id: modal.aulaId, titulo: form.titulo, tipo: form.tipo }]);
    setModal(null);
    setForm({ titulo: "", tipo: "multipla_escolha", questao_texto: "", alt_a: "", alt_b: "", alt_c: "", alt_d: "", resposta: "0" });
    router.refresh();
  }

  async function excluirAtividade(id: string) {
    if (!confirm("Excluir esta atividade?")) return;
    await fetch(`/api/atividades?id=${id}`, { method: "DELETE" });
    setAtvs((p) => p.filter((a) => a.id !== id));
  }

  return (
    <div>
      {aulas.map((aula) => {
        const atvAula = atvs.filter((a) => a.aula_id === aula.id);
        return (
          <div key={aula.id} style={{ marginBottom: "24px" }}>
            <div className="coord-tab-module-header">
              <span className="coord-module-num">{String(aula.ordem).padStart(2, "0")}</span>
              <span style={{ fontWeight: 600 }}>{aula.titulo}</span>
              <span className="badge badge-muted">{atvAula.length} atividade{atvAula.length !== 1 ? "s" : ""}</span>
              <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }}
                onClick={() => { setModal({ aulaId: aula.id, aulaTitle: aula.titulo }); setErro(""); }}>
                + Nova Atividade
              </button>
            </div>
            {atvAula.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: "var(--cj-text-muted)", padding: "10px 0" }}>
                Nenhuma atividade para este módulo.
              </p>
            ) : (
              atvAula.map((atv) => (
                <div key={atv.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                  <span className={`badge ${atv.tipo === "dissertativa" ? "badge-warning" : "badge-teal"}`} style={{ minWidth: "100px", justifyContent: "center" }}>
                    {atv.tipo === "multipla_escolha" ? "Múltipla" : atv.tipo === "verdadeiro_falso" ? "V/F" : atv.tipo === "dissertativa" ? "Dissertativa" : "Upload"}
                  </span>
                  <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 600 }}>{atv.titulo}</span>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--cj-danger)" }} onClick={() => excluirAtividade(atv.id)}>
                    Excluir
                  </button>
                </div>
              ))
            )}
          </div>
        );
      })}

      {/* Modal nova atividade */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nova atividade avaliativa</div>
                <div className="modal-subtitle">{modal.aulaTitle}</div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>{CLOSE_SVG}</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Título *</label>
                  <input className="form-input" placeholder="Ex: Avaliação Módulo 01" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))} autoFocus />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
                    <option value="multipla_escolha">Múltipla escolha</option>
                    <option value="verdadeiro_falso">Verdadeiro / Falso</option>
                    <option value="dissertativa">Dissertativa</option>
                    <option value="upload">Upload de arquivo</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Enunciado *</label>
                  <textarea className="form-input form-textarea" rows={3} placeholder="Digite a pergunta…" value={form.questao_texto} onChange={(e) => setForm((p) => ({ ...p, questao_texto: e.target.value }))} />
                </div>
                {form.tipo === "multipla_escolha" && (
                  <>
                    <div className="form-group form-group-full"><label className="form-label">Alternativa A *</label><input className="form-input" value={form.alt_a} onChange={(e) => setForm((p) => ({ ...p, alt_a: e.target.value }))} /></div>
                    <div className="form-group form-group-full"><label className="form-label">Alternativa B *</label><input className="form-input" value={form.alt_b} onChange={(e) => setForm((p) => ({ ...p, alt_b: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Alternativa C</label><input className="form-input" value={form.alt_c} onChange={(e) => setForm((p) => ({ ...p, alt_c: e.target.value }))} /></div>
                    <div className="form-group"><label className="form-label">Alternativa D</label><input className="form-input" value={form.alt_d} onChange={(e) => setForm((p) => ({ ...p, alt_d: e.target.value }))} /></div>
                    <div className="form-group form-group-full">
                      <label className="form-label">Resposta correta</label>
                      <select className="form-input" value={form.resposta} onChange={(e) => setForm((p) => ({ ...p, resposta: e.target.value }))}>
                        <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
                      </select>
                    </div>
                  </>
                )}
                {form.tipo === "verdadeiro_falso" && (
                  <div className="form-group form-group-full">
                    <label className="form-label">Resposta correta</label>
                    <select className="form-input" value={form.resposta} onChange={(e) => setForm((p) => ({ ...p, resposta: e.target.value }))}>
                      <option value="0">Verdadeiro</option><option value="1">Falso</option>
                    </select>
                  </div>
                )}
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={criarAtividade} disabled={saving}>{saving ? "Salvando…" : "Criar atividade"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Correções ── */
function TabCorrecoes({ submissoes: subIniciais, notaMinima }: { submissoes: Submissao[]; notaMinima: number }) {
  const router = useRouter();
  const [subs, setSubs] = useState(subIniciais);
  const [modal, setModal] = useState<Submissao | null>(null);
  const [nota, setNota] = useState("7");
  const [saving, setSaving] = useState(false);

  async function salvarNota() {
    if (!modal) return;
    const n = Number(nota);
    if (isNaN(n) || n < 0 || n > 10) { alert("Nota deve ser entre 0 e 10."); return; }
    setSaving(true);
    await fetch(`/api/atividades?id=${modal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota: n }),
    });
    setSaving(false);
    setSubs((p) => p.map((s) => s.id === modal.id ? { ...s, nota: n, status: "corrigida" } : s));
    setModal(null);
    router.refresh();
  }

  const pendentes = subs.filter((s) => s.status === "aguardando_correcao");
  const corrigidas = subs.filter((s) => s.status === "corrigida");

  return (
    <div>
      {pendentes.length === 0 && corrigidas.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">Nenhuma submissão ainda</div>
          <p className="empty-desc">As submissões dos alunos aparecerão aqui.</p>
        </div>
      )}

      {pendentes.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cj-warning)", marginBottom: "10px" }}>
            Aguardando correção ({pendentes.length})
          </div>
          {pendentes.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{s.aluno_nome}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)" }}>{s.atividade_titulo} · {s.aula_titulo}</div>
              </div>
              <span className="badge badge-warning">Aguardando</span>
              <button className="btn btn-primary btn-sm" onClick={() => { setModal(s); setNota("7"); }}>
                Dar nota
              </button>
            </div>
          ))}
        </div>
      )}

      {corrigidas.length > 0 && (
        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cj-text-muted)", marginBottom: "10px" }}>
            Já corrigidas ({corrigidas.length})
          </div>
          {corrigidas.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{s.aluno_nome}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)" }}>{s.atividade_titulo} · {s.aula_titulo}</div>
              </div>
              <span className={`badge ${s.nota !== null && s.nota >= notaMinima ? "badge-success" : "badge-danger"}`}>
                Nota: {s.nota?.toFixed(1)}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setModal(s); setNota(String(s.nota ?? 7)); }}>
                Alterar
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Lançar nota</div>
                <div className="modal-subtitle">{modal.aluno_nome} — {modal.atividade_titulo}</div>
              </div>
              <button className="modal-close" onClick={() => setModal(null)}>{CLOSE_SVG}</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nota (0 a 10)</label>
                <input className="form-input" type="number" min="0" max="10" step="0.5"
                  value={nota} onChange={(e) => setNota(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarNota} disabled={saving}>{saving ? "Salvando…" : "Lançar nota"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Componente principal ── */
export function CoordCursoManager({
  cursoId, notaMinima, aulas, atividades, submissoes,
}: {
  cursoId: string;
  notaMinima: number;
  aulas: Aula[];
  atividades: Atividade[];
  submissoes: Submissao[];
}) {
  const TABS = [
    { key: "modulos", label: "Módulos & Vídeos" },
    { key: "materiais", label: "Materiais (PDF)" },
    { key: "avaliacoes", label: "Avaliações" },
    { key: "correcoes", label: `Correções${submissoes.filter((s) => s.status === "aguardando_correcao").length > 0 ? ` (${submissoes.filter((s) => s.status === "aguardando_correcao").length})` : ""}` },
  ] as const;

  const [tab, setTab] = useState<"modulos" | "materiais" | "avaliacoes" | "correcoes">("modulos");

  return (
    <div className="card">
      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--cj-dark-border)", padding: "0 20px" }}>
        {TABS.map((t) => (
          <button key={t.key} className="coord-tab-btn" data-active={tab === t.key ? "true" : "false"}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-body">
        {tab === "modulos" && <TabModulos cursoId={cursoId} aulas={aulas} notaMinima={notaMinima} />}
        {tab === "materiais" && <TabMateriais aulas={aulas} />}
        {tab === "avaliacoes" && <TabAvaliacoes aulas={aulas} atividades={atividades} />}
        {tab === "correcoes" && <TabCorrecoes submissoes={submissoes} notaMinima={notaMinima} />}
      </div>
    </div>
  );
}
