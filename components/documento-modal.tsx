"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = ["RG", "CPF", "Comprovante de residência", "Foto 3x4", "Diploma/Certificado anterior", "Contrato", "Outro"];

export function EnviarDocumentoBtn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: TIPOS[0], nome_arquivo: "", arquivo_url: "" });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.tipo || !form.nome_arquivo.trim()) { setErro("Tipo e nome do arquivo são obrigatórios."); return; }
    setSaving(true);
    const res = await fetch("/api/documentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: form.tipo, nome_arquivo: form.nome_arquivo, arquivo_url: form.arquivo_url || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao enviar."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        Enviar Documento
      </button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Enviar documento</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Tipo de documento *</label>
                  <select className="form-input" value={form.tipo} onChange={(e) => upd("tipo", e.target.value)}>
                    {TIPOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Nome do arquivo *</label>
                  <input className="form-input" placeholder="Ex: RG_frente.pdf" value={form.nome_arquivo} onChange={(e) => upd("nome_arquivo", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Link do arquivo (Google Drive, Dropbox…)</label>
                  <input className="form-input" type="url" placeholder="https://drive.google.com/..." value={form.arquivo_url} onChange={(e) => upd("arquivo_url", e.target.value)} />
                  <span className="form-hint">Compartilhe o link do arquivo com permissão de visualização</span>
                </div>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Enviando…" : "Enviar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
