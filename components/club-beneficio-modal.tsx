"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type ClubBeneficio = {
  id?: string;
  nome_empresa: string;
  categoria: string;
  descricao: string | null;
  desconto: string;
  cupom: string | null;
  link_url: string | null;
  contato: string | null;
  endereco: string | null;
  regras: string | null;
  ativo: boolean;
};

const emptyForm = {
  nome_empresa: "",
  categoria: "",
  descricao: "",
  desconto: "",
  cupom: "",
  link_url: "",
  contato: "",
  endereco: "",
  regras: "",
  ativo: true,
};

export function ClubBeneficioModal({ beneficio }: { beneficio?: ClubBeneficio }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    nome_empresa: beneficio?.nome_empresa || "",
    categoria: beneficio?.categoria || "",
    descricao: beneficio?.descricao || "",
    desconto: beneficio?.desconto || "",
    cupom: beneficio?.cupom || "",
    link_url: beneficio?.link_url || "",
    contato: beneficio?.contato || "",
    endereco: beneficio?.endereco || "",
    regras: beneficio?.regras || "",
    ativo: beneficio?.ativo ?? true,
  });

  const isEdit = Boolean(beneficio?.id);

  function upd(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function salvar() {
    if (!form.nome_empresa.trim() || !form.categoria.trim() || !form.desconto.trim()) {
      setErro("Empresa, categoria e desconto sao obrigatorios.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/club", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: beneficio?.id, ...form }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Erro ao salvar beneficio.");
      return;
    }

    setOpen(false);
    if (!isEdit) setForm(emptyForm);
    router.refresh();
  }

  async function excluir() {
    if (!beneficio?.id || !confirm(`Excluir o beneficio de ${beneficio.nome_empresa}?`)) return;
    setSaving(true);
    await fetch(`/api/club?id=${beneficio.id}`, { method: "DELETE" });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className={isEdit ? "btn btn-ghost btn-sm" : "btn btn-primary"} onClick={() => setOpen(true)}>
        {isEdit ? "Editar" : "+ Novo desconto"}
      </button>
      {open && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: "780px" }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{isEdit ? "Editar desconto" : "Novo desconto ClubCondoJob"}</div>
                <div className="modal-subtitle">Cadastre lojas, servicos e empresas parceiras.</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Empresa *</label>
                  <input className="form-input" value={form.nome_empresa} onChange={(e) => upd("nome_empresa", e.target.value)} placeholder="Nome da loja ou empresa" />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <input className="form-input" value={form.categoria} onChange={(e) => upd("categoria", e.target.value)} placeholder="Ex: Mercado, Farmacia, Servicos" />
                </div>
                <div className="form-group">
                  <label className="form-label">Desconto *</label>
                  <input className="form-input" value={form.desconto} onChange={(e) => upd("desconto", e.target.value)} placeholder="Ex: 15% de desconto" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cupom</label>
                  <input className="form-input" value={form.cupom} onChange={(e) => upd("cupom", e.target.value)} placeholder="Ex: CONDOJOB15" />
                </div>
                <div className="form-group">
                  <label className="form-label">Link</label>
                  <input className="form-input" value={form.link_url} onChange={(e) => upd("link_url", e.target.value)} placeholder="https://..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Contato</label>
                  <input className="form-input" value={form.contato} onChange={(e) => upd("contato", e.target.value)} placeholder="WhatsApp, telefone ou e-mail" />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Endereco</label>
                  <input className="form-input" value={form.endereco} onChange={(e) => upd("endereco", e.target.value)} placeholder="Endereco ou area de atendimento" />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Descricao</label>
                  <textarea className="form-input form-textarea" value={form.descricao} onChange={(e) => upd("descricao", e.target.value)} rows={3} placeholder="Resumo do beneficio para o aluno" />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Regras de uso</label>
                  <textarea className="form-input form-textarea" value={form.regras} onChange={(e) => upd("regras", e.target.value)} rows={3} placeholder="Ex: Valido ate..., apresentar certificado, nao cumulativo..." />
                </div>
                <label className="form-group form-group-full" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.ativo} onChange={(e) => upd("ativo", e.target.checked)} />
                  <span className="form-label" style={{ margin: 0 }}>Beneficio ativo para alunos</span>
                </label>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer" style={{ justifyContent: isEdit ? "space-between" : "flex-end" }}>
              {isEdit && <button className="btn btn-danger" onClick={excluir} disabled={saving}>Excluir</button>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
