"use client";

import { useState } from "react";
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

/* ─── Modal Novo Aluno ─── */
export function NovoAlunoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", telefone: "" });
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
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Novo Aluno</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Cadastrar aluno</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Nome completo *</label>
                  <input className="form-input" placeholder="João da Silva" value={form.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input className="form-input" type="email" placeholder="aluno@email.com" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input className="form-input" placeholder="(11) 99999-9999" value={form.telefone} onChange={(e) => upd("telefone", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Senha de acesso *</label>
                  <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={(e) => upd("senha", e.target.value)} />
                </div>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Cadastrando…" : "Cadastrar aluno"}</button>
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

/* ─── Modal Nova Aula ─── */
type AulaData = { id?: string; titulo?: string; video_url?: string; conteudo?: string; ordem?: number };

export function AulaModal({ cursoId, aula }: { cursoId: string; aula?: AulaData }) {
  const router = useRouter();
  const isEdit = Boolean(aula?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: String(aula?.titulo || ""), video_url: String(aula?.video_url || ""), conteudo: String(aula?.conteudo || ""), ordem: String(aula?.ordem || "1") });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.titulo.trim()) { setErro("Título da aula é obrigatório."); return; }
    setSaving(true);
    const res = await fetch("/api/aulas", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: aula?.id, curso_id: cursoId, ...form, ordem: Number(form.ordem) }),
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
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Título da aula *</label>
                  <input className="form-input" placeholder="Ex: Comunicação com Moradores" value={form.titulo} onChange={(e) => upd("titulo", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Ordem</label>
                  <input className="form-input" type="number" min="1" value={form.ordem} onChange={(e) => upd("ordem", e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">URL do vídeo (YouTube ou link direto)</label>
                  <input className="form-input" type="url" placeholder="https://youtube.com/watch?v=..." value={form.video_url} onChange={(e) => upd("video_url", e.target.value)} />
                  <span className="form-hint">Suporta links do YouTube, Vimeo ou vídeo direto (.mp4)</span>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Conteúdo / texto</label>
                  <textarea className="form-input form-textarea" rows={4} placeholder="Conteúdo da aula em HTML ou texto…" value={form.conteudo} onChange={(e) => upd("conteudo", e.target.value)} />
                </div>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : isEdit ? "Salvar" : "Criar aula"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
