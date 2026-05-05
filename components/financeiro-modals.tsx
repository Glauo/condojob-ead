"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NovoPagamentoModal({ alunos, cursos }: { alunos: { id: string; nome: string }[]; cursos: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ usuario_id: alunos[0]?.id || "", curso_id: "", descricao: "", valor: "", vencimento: "" });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.usuario_id || !form.valor) { setErro("Aluno e valor são obrigatórios."); return; }
    setSaving(true);
    const res = await fetch("/api/financeiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, valor: Number(form.valor), curso_id: form.curso_id || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao salvar."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Novo Lançamento</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Novo lançamento financeiro</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Aluno *</label>
                  <select className="form-input" value={form.usuario_id} onChange={(e) => upd("usuario_id", e.target.value)}>
                    {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Curso (opcional)</label>
                  <select className="form-input" value={form.curso_id} onChange={(e) => upd("curso_id", e.target.value)}>
                    <option value="">— Nenhum —</option>
                    {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Descrição</label>
                  <input className="form-input" placeholder="Ex: Mensalidade Janeiro/2026" value={form.descricao} onChange={(e) => upd("descricao", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => upd("valor", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vencimento</label>
                  <input className="form-input" type="date" value={form.vencimento} onChange={(e) => upd("vencimento", e.target.value)} />
                </div>
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Criar lançamento"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
