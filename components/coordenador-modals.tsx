"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Modal Novo Curso ─── */
type CursoData = { id?: string; nome?: string; descricao?: string; carga_horaria?: number; preco?: number; nota_minima?: number; max_tentativas?: number };

export function CursoModal({ curso }: { curso?: CursoData } = {}) {
  const router = useRouter();
  const isEdit = Boolean(curso?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: String(curso?.nome || ""),
    descricao: String(curso?.descricao || ""),
    carga_horaria: String(curso?.carga_horaria || "0"),
    preco: String(curso?.preco || "0"),
    nota_minima: String(curso?.nota_minima || "7"),
    max_tentativas: String(curso?.max_tentativas || "3"),
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.nome.trim()) { setErro("Nome do curso é obrigatório."); return; }
    setSaving(true);
    const res = await fetch("/api/cursos", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: curso?.id, ...form, carga_horaria: Number(form.carga_horaria), preco: Number(form.preco), nota_minima: Number(form.nota_minima), max_tentativas: Number(form.max_tentativas) }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao salvar."); return; }
    setOpen(false);
    router.refresh();
  }

  async function excluir() {
    if (!confirm(`Excluir o curso "${curso?.nome}"? Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    await fetch(`/api/cursos?id=${curso?.id}`, { method: "DELETE" });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {isEdit
        ? <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Editar</button>
        : <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Novo Curso</button>
      }
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">{isEdit ? "Editar curso" : "Novo curso"}</div>
                {isEdit && <div className="modal-subtitle">{curso?.nome}</div>}
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Nome do curso *</label>
                  <input className="form-input" placeholder="Ex: Porteiro Profissional Nível 1" value={form.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-input form-textarea" placeholder="Descrição do curso…" value={form.descricao} onChange={(e) => upd("descricao", e.target.value)} rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Carga horária (h)</label>
                  <input className="form-input" type="number" min="0" value={form.carga_horaria} onChange={(e) => upd("carga_horaria", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Preço (R$)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.preco} onChange={(e) => upd("preco", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nota mínima (0–10)</label>
                  <input className="form-input" type="number" min="0" max="10" step="0.5" value={form.nota_minima} onChange={(e) => upd("nota_minima", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Máx. tentativas</label>
                  <input className="form-input" type="number" min="1" value={form.max_tentativas} onChange={(e) => upd("max_tentativas", e.target.value)} />
                </div>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              {isEdit && <button className="btn btn-danger btn-sm" onClick={excluir} disabled={saving} style={{ marginRight: "auto" }}>Excluir</button>}
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : isEdit ? "Salvar" : "Criar curso"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Modal Novo Usuário (Aluno ou Coordenador) ─── */
export function NovoAlunoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    perfil: "aluno",
    nome: "",
    email: "",
    senha: "",
    data_nascimento: "",
    rg: "",
    cpf: "",
    estado_civil: "",
    cep: "",
    cidade: "",
    rua: "",
    numero: "",
    complemento: "",
    celular_whatsapp: "",
    telefone: "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.senha) { setErro("Nome, e-mail e senha são obrigatórios."); return; }
    setSaving(true);
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao salvar."); return; }
    setOpen(false);
    setForm({ perfil: "aluno", nome: "", email: "", senha: "", data_nascimento: "", rg: "", cpf: "", estado_civil: "", cep: "", cidade: "", rua: "", numero: "", complemento: "", celular_whatsapp: "", telefone: "" });
    router.refresh();
  }

  const labelCadastrar = form.perfil === "coordenador" ? "Cadastrar coordenador" : "Cadastrar aluno";

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Novo Cadastro</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "680px" }}>
            <div className="modal-header">
              <div className="modal-title">Cadastrar usuário</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Tipo de perfil */}
              <div className="form-group form-group-full" style={{ marginBottom: "16px" }}>
                <label className="form-label">Tipo de perfil *</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {(["aluno", "coordenador"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => upd("perfil", p)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: "8px", border: "2px solid",
                        borderColor: form.perfil === p ? "var(--cj-teal)" : "var(--cj-dark-border)",
                        background: form.perfil === p ? "var(--cj-teal-bg)" : "transparent",
                        color: form.perfil === p ? "var(--cj-teal)" : "var(--cj-text-muted)",
                        fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {p === "aluno" ? "👨‍🎓 Aluno" : "👨‍💼 Coordenador"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-section-label">Dados pessoais</div>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Nome completo *</label>
                  <input className="form-input" placeholder="João da Silva" value={form.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de nascimento</label>
                  <input className="form-input" type="date" value={form.data_nascimento} onChange={(e) => upd("data_nascimento", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado civil</label>
                  <select className="form-input" value={form.estado_civil} onChange={(e) => upd("estado_civil", e.target.value)}>
                    <option value="">Selecione…</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União estável">União estável</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">RG</label>
                  <input className="form-input" placeholder="00.000.000-0" value={form.rg} onChange={(e) => upd("rg", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input className="form-input" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => upd("cpf", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-label" style={{ marginTop: "16px" }}>Endereço</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <input className="form-input" placeholder="00000-000" value={form.cep} onChange={(e) => upd("cep", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" placeholder="São Paulo" value={form.cidade} onChange={(e) => upd("cidade", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rua / Logradouro</label>
                  <input className="form-input" placeholder="Rua das Flores" value={form.rua} onChange={(e) => upd("rua", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input className="form-input" placeholder="123" value={form.numero} onChange={(e) => upd("numero", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Complemento</label>
                  <input className="form-input" placeholder="Apto 12, Bloco B…" value={form.complemento} onChange={(e) => upd("complemento", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-label" style={{ marginTop: "16px" }}>Contato & Acesso</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input className="form-input" type="email" placeholder="aluno@email.com" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Celular / WhatsApp</label>
                  <input className="form-input" placeholder="(11) 99999-9999" value={form.celular_whatsapp} onChange={(e) => upd("celular_whatsapp", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Senha de acesso *</label>
                  <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={(e) => upd("senha", e.target.value)} />
                </div>
              </div>

              {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Cadastrando…" : labelCadastrar}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Modal Matricular Aluno ─── */
export function MatricularAlunoModal({ alunoId, alunoNome, cursos }: { alunoId: string; alunoNome: string; cursos: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cursoId, setCursoId] = useState(cursos[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function matricular() {
    if (!cursoId) { setErro("Selecione um curso."); return; }
    setSaving(true);
    const res = await fetch("/api/alunos/matricular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: alunoId, curso_id: cursoId }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao matricular."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Matricular</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Matricular em curso</div>
                <div className="modal-subtitle">{alunoNome}</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Selecione o curso</label>
                {cursos.length === 0 ? (
                  <p style={{ color: "var(--cj-text-muted)", fontSize: "0.875rem" }}>Nenhum curso disponível. Crie um curso primeiro.</p>
                ) : (
                  <select className="form-input" value={cursoId} onChange={(e) => { setCursoId(e.target.value); setErro(""); }}>
                    {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                )}
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={matricular} disabled={saving || cursos.length === 0}>{saving ? "Matriculando…" : "Matricular"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Modal Nova Aula (com upload de vídeo) ─── */
type AulaData = { id?: string; titulo?: string; video_url?: string; conteudo?: string; ordem?: number };

export function AulaModal({ cursoId, aula }: { cursoId: string; aula?: AulaData }) {
  const router = useRouter();
  const isEdit = Boolean(aula?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: String(aula?.titulo || ""),
    video_url: String(aula?.video_url || ""),
    conteudo: String(aula?.conteudo || ""),
    ordem: String(aula?.ordem || "1"),
  });
  const [videoMode, setVideoMode] = useState<"url" | "upload">("url");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.titulo.trim()) { setErro("Título da aula é obrigatório."); return; }

    let finalVideoUrl = form.video_url;

    if (videoMode === "upload" && uploadFile) {
      setUploading(true);
      const fd = new FormData();
      fd.append("video", uploadFile);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      setUploading(false);
      if (!upRes.ok) {
        const d = await upRes.json().catch(() => ({}));
        setErro((d as { error?: string }).error || "Erro no upload do vídeo.");
        return;
      }
      const { url } = await upRes.json();
      finalVideoUrl = url;
    }

    setSaving(true);
    const res = await fetch("/api/aulas", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: aula?.id, curso_id: cursoId, ...form, video_url: finalVideoUrl, ordem: Number(form.ordem) }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao salvar."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {isEdit
        ? <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Editar</button>
        : <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Nova Aula</button>
      }
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">{isEdit ? "Editar aula" : "Nova aula"}</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Título da aula *</label>
                  <input className="form-input" placeholder="Ex: Comunicação com Moradores" value={form.titulo} onChange={(e) => upd("titulo", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Ordem</label>
                  <input className="form-input" type="number" min="1" max="10" value={form.ordem} onChange={(e) => upd("ordem", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Vídeo da aula</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${videoMode === "url" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setVideoMode("url")}
                    >
                      🔗 Link (YouTube / URL)
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${videoMode === "upload" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setVideoMode("upload")}
                    >
                      ⬆ Upload de arquivo
                    </button>
                  </div>

                  {videoMode === "url" ? (
                    <>
                      <input
                        className="form-input"
                        type="url"
                        placeholder="https://youtube.com/watch?v=... ou link .mp4"
                        value={form.video_url}
                        onChange={(e) => upd("video_url", e.target.value)}
                      />
                      <span className="form-hint">Suporta YouTube, Vimeo ou vídeo direto (.mp4, .webm)</span>
                    </>
                  ) : (
                    <div
                      className="upload-drop-zone"
                      onClick={() => fileRef.current?.click()}
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        style={{ display: "none" }}
                        onChange={(e) => { setUploadFile(e.target.files?.[0] || null); setErro(""); }}
                      />
                      {uploadFile ? (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>🎬</div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--cj-teal)" }}>{uploadFile.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>
                            {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "2rem", marginBottom: "6px" }}>📹</div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Clique para selecionar vídeo</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--cj-text-muted)", marginTop: "2px" }}>MP4, WebM ou OGG · máx. 500 MB</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Conteúdo / texto</label>
                  <textarea className="form-input form-textarea" rows={4} placeholder="Conteúdo da aula em HTML ou texto…" value={form.conteudo} onChange={(e) => upd("conteudo", e.target.value)} />
                </div>
              </div>
              {uploading && (
                <div style={{ marginTop: "10px", padding: "10px", background: "var(--cj-teal-bg)", borderRadius: "8px", fontSize: "0.82rem", color: "var(--cj-teal)" }}>
                  Enviando vídeo… Aguarde, isso pode demorar alguns instantes.
                </div>
              )}
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving || uploading}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving || uploading}>
                {uploading ? "Enviando vídeo…" : saving ? "Salvando…" : isEdit ? "Salvar" : "Criar aula"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
