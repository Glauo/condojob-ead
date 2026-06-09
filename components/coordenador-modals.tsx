"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

function normalizeVideoLink(value: string) {
  const url = value.trim();
  if (!url) return "";
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([^?&/\s]+)/i);
  if (youtube?.[1]) return `https://www.youtube.com/watch?v=${youtube[1]}`;
  return url;
}

/* ─── Modal Novo Curso ─── */
type CursoData = { id?: string; nome?: string; descricao?: string; carga_horaria?: number; preco?: number; link_pagamento?: string | null; nota_minima?: number; max_tentativas?: number };

export function CursoModal({ curso }: { curso?: CursoData } = {}) {
  const router = useRouter();
  const isEdit = Boolean(curso?.id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: String(curso?.nome || ""),
    descricao: String(curso?.descricao || ""),
    carga_horaria: String(curso?.carga_horaria || "0"),
    preco: String(curso?.preco || "0"),
    link_pagamento: String(curso?.link_pagamento || ""),
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
                <div className="form-group form-group-full">
                  <label className="form-label">Link de pagamento Mercado Pago</label>
                  <input className="form-input" placeholder="https://mpago.la/..." value={form.link_pagamento} onChange={(e) => upd("link_pagamento", e.target.value)} />
                  <span className="form-hint">Quando preenchido, o aluno sera enviado para este link apos o cadastro.</span>
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
export type AlunoCadastroData = {
  id: string;
  nome: string;
  login?: string | null;
  email: string;
  telefone?: string | null;
  celular_whatsapp?: string | null;
  data_nascimento?: string | null;
  rg?: string | null;
  cpf?: string | null;
  estado_civil?: string | null;
  cep?: string | null;
  cidade?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  ativo?: boolean | null;
};

export function ExcluirUsuarioButton({ usuarioId, usuarioNome, perfil }: { usuarioId: string; usuarioNome: string; perfil: "aluno" | "coordenador" }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function excluir() {
    const tipo = perfil === "coordenador" ? "usuario administrativo" : "aluno";
    if (!confirm(`Excluir ${tipo} "${usuarioNome}"? Esta acao remove matriculas, progresso, pagamentos, documentos e mensagens vinculadas.`)) return;

    setSaving(true);
    const res = await fetch(`/api/alunos?id=${usuarioId}`, { method: "DELETE" });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert((d as { error?: string }).error || "Erro ao excluir usuario.");
      return;
    }

    router.refresh();
  }

  return (
    <button className="btn btn-danger btn-sm" onClick={excluir} disabled={saving}>
      {saving ? "Excluindo..." : "Excluir"}
    </button>
  );
}

type UsuarioAdminData = {
  id: string;
  nome: string;
  login?: string | null;
  email: string;
  ativo?: boolean | null;
};

export function EditarUsuarioAdminModal({ usuario }: { usuario: UsuarioAdminData }) {
  const router = useRouter();
  const protectedAdmin = String(usuario.login || "").toLowerCase().trim() === "admin";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: usuario.nome || "",
    login: usuario.login || "",
    email: usuario.email || "",
    senha: "",
    ativo: usuario.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  function upd<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim() || !form.login.trim()) {
      setErro("Nome, e-mail e login sao obrigatorios.");
      return;
    }
    if (form.senha && form.senha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/alunos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: usuario.id,
        nome: form.nome,
        login: protectedAdmin ? "admin" : form.login,
        email: form.email,
        senha: form.senha.trim() || undefined,
        ativo: protectedAdmin ? true : form.ativo,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro((d as { error?: string }).error || "Erro ao salvar usuario administrativo.");
      return;
    }

    setOpen(false);
    setForm((prev) => ({ ...prev, senha: "" }));
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Editar</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Editar usuario administrativo</div>
                <div className="modal-subtitle">{usuario.nome}</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {protectedAdmin && (
                <div className="form-hint" style={{ marginBottom: "14px" }}>
                  Este e o usuario principal do sistema. Login, senha e status ativo ficam protegidos.
                </div>
              )}
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Login *</label>
                  <input className="form-input" value={form.login} onChange={(e) => upd("login", e.target.value)} disabled={protectedAdmin} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Nova senha</label>
                  <input
                    className="form-input"
                    type={showSenha ? "text" : "password"}
                    placeholder="Deixe em branco para manter"
                    value={form.senha}
                    disabled={protectedAdmin}
                    onChange={(e) => upd("senha", e.target.value)}
                  />
                  {!protectedAdmin && (
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowSenha((v) => !v)} style={{ marginTop: "8px" }}>
                      {showSenha ? "Ocultar senha" : "Ver senha"}
                    </button>
                  )}
                </div>
                <label className="form-group form-group-full" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: protectedAdmin ? "not-allowed" : "pointer" }}>
                  <input type="checkbox" checked={form.ativo} disabled={protectedAdmin} onChange={(e) => upd("ativo", e.target.checked)} />
                  <span className="form-label" style={{ margin: 0 }}>Usuario ativo</span>
                </label>
              </div>
              {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar alteracoes"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function NovoAlunoModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    perfil: "aluno",
    nome: "",
    login: "",
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
  const [showSenha, setShowSenha] = useState(false);

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
    setForm({ perfil: "aluno", nome: "", login: "", email: "", senha: "", data_nascimento: "", rg: "", cpf: "", estado_civil: "", cep: "", cidade: "", rua: "", numero: "", complemento: "", celular_whatsapp: "", telefone: "" });
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
                  {form.perfil === "aluno" && <span className="form-hint">O e-mail cadastrado sera o login do aluno.</span>}
                </div>
                {form.perfil === "coordenador" && (
                  <div className="form-group">
                    <label className="form-label">Login de acesso *</label>
                    <input className="form-input" placeholder="ex: coordenacao" value={form.login} onChange={(e) => upd("login", e.target.value)} />
                    <span className="form-hint">Campo usado apenas para acesso administrativo.</span>
                  </div>
                )}
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

/* ─── Modal Editar Aluno ─── */
export function EditarAlunoModal({ aluno }: { aluno: AlunoCadastroData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: aluno.nome || "",
    email: aluno.email || "",
    senha: "",
    data_nascimento: aluno.data_nascimento?.slice(0, 10) || "",
    rg: aluno.rg || "",
    cpf: aluno.cpf || "",
    estado_civil: aluno.estado_civil || "",
    cep: aluno.cep || "",
    cidade: aluno.cidade || "",
    rua: aluno.rua || "",
    numero: aluno.numero || "",
    complemento: aluno.complemento || "",
    celular_whatsapp: aluno.celular_whatsapp || "",
    telefone: aluno.telefone || "",
    ativo: aluno.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  function upd<K extends keyof typeof form>(f: K, v: (typeof form)[K]) {
    setForm((p) => ({ ...p, [f]: v }));
    setErro("");
  }

  async function salvar() {
    if (!form.nome.trim() || !form.email.trim()) {
      setErro("Nome e e-mail são obrigatórios.");
      return;
    }
    if (form.senha && form.senha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setSaving(true);
    const payload = { id: aluno.id, ...form, senha: form.senha.trim() || undefined };
    const res = await fetch("/api/alunos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro((d as { error?: string }).error || "Erro ao salvar cadastro.");
      return;
    }

    setOpen(false);
    setForm((p) => ({ ...p, senha: "" }));
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Editar</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "720px" }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Editar cadastro</div>
                <div className="modal-subtitle">{aluno.nome}</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-section-label">Dados pessoais</div>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Nome completo *</label>
                  <input className="form-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de nascimento</label>
                  <input className="form-input" type="date" value={form.data_nascimento} onChange={(e) => upd("data_nascimento", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado civil</label>
                  <select className="form-input" value={form.estado_civil} onChange={(e) => upd("estado_civil", e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União estável">União estável</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">RG</label>
                  <input className="form-input" value={form.rg} onChange={(e) => upd("rg", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input className="form-input" value={form.cpf} onChange={(e) => upd("cpf", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-label" style={{ marginTop: "16px" }}>Endereço</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">CEP</label>
                  <input className="form-input" value={form.cep} onChange={(e) => upd("cep", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cidade</label>
                  <input className="form-input" value={form.cidade} onChange={(e) => upd("cidade", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rua / Logradouro</label>
                  <input className="form-input" value={form.rua} onChange={(e) => upd("rua", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Número</label>
                  <input className="form-input" value={form.numero} onChange={(e) => upd("numero", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Complemento</label>
                  <input className="form-input" value={form.complemento} onChange={(e) => upd("complemento", e.target.value)} />
                </div>
              </div>

              <div className="modal-section-label" style={{ marginTop: "16px" }}>Contato & Acesso</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
                  <span className="form-hint">Este e-mail e o login de acesso do aluno.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Celular / WhatsApp</label>
                  <input className="form-input" value={form.celular_whatsapp} onChange={(e) => upd("celular_whatsapp", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input className="form-input" value={form.telefone} onChange={(e) => upd("telefone", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nova senha</label>
                  <input className="form-input" type={showNovaSenha ? "text" : "password"} placeholder="Deixe em branco para manter" value={form.senha} onChange={(e) => upd("senha", e.target.value)} />
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowNovaSenha((v) => !v)} style={{ marginTop: "8px" }}>
                    {showNovaSenha ? "Ocultar senha" : "Ver senha"}
                  </button>
                </div>
                <label className="form-group form-group-full" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.ativo} onChange={(e) => upd("ativo", e.target.checked)} />
                  <span className="form-label" style={{ margin: 0 }}>Aluno ativo</span>
                </label>
              </div>

              {erro && <div className="form-error" style={{ marginTop: "12px" }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button>
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

    let finalVideoUrl = normalizeVideoLink(form.video_url);

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
                      Link do YouTube
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
                        placeholder="Cole aqui o link do YouTube: https://youtube.com/watch?v=..."
                        value={form.video_url}
                        onChange={(e) => upd("video_url", e.target.value)}
                      />
                      <span className="form-hint">Tambem aceita youtu.be, Shorts, lives, Vimeo ou MP4 externo.</span>
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
