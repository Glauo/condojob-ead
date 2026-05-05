"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AprovarDocModal({ docId, nomeArquivo }: { docId: string; nomeArquivo: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);

  async function atualizar(status: "aprovado" | "rejeitado") {
    setSaving(true);
    await fetch("/api/documentos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: docId, status, observacoes: obs || null }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Analisar</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Analisar documento</div>
                <div className="modal-subtitle">{nomeArquivo}</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Observações (opcional)</label>
                <textarea className="form-input form-textarea" rows={3} placeholder="Motivo da rejeição ou comentário…" value={obs} onChange={(e) => setObs(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => atualizar("rejeitado")} disabled={saving}>{saving ? "…" : "Rejeitar"}</button>
              <button className="btn btn-primary" onClick={() => atualizar("aprovado")} disabled={saving} style={{ background: "var(--cj-success)" }}>{saving ? "…" : "Aprovar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
