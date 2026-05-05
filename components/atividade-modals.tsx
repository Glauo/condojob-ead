"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Modal Nova Atividade ─── */
export function AtividadeModal({ aulaId }: { aulaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", tipo: "multipla_escolha", questao_texto: "", alternativa_a: "", alternativa_b: "", alternativa_c: "", alternativa_d: "", resposta_correta: "0" });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  function upd(f: keyof typeof form, v: string) { setForm((p) => ({ ...p, [f]: v })); setErro(""); }

  async function salvar() {
    if (!form.titulo.trim() || !form.questao_texto.trim()) { setErro("Título e texto da questão são obrigatórios."); return; }
    const questoes = [{
      texto: form.questao_texto,
      alternativas: form.tipo === "multipla_escolha"
        ? [form.alternativa_a, form.alternativa_b, form.alternativa_c, form.alternativa_d].filter(Boolean)
        : form.tipo === "verdadeiro_falso"
        ? ["Verdadeiro", "Falso"]
        : undefined,
      resposta_correta: form.tipo === "multipla_escolha" || form.tipo === "verdadeiro_falso"
        ? Number(form.resposta_correta) : undefined,
    }];
    setSaving(true);
    const res = await fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aula_id: aulaId, titulo: form.titulo, tipo: form.tipo, questoes }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setErro((d as { error?: string }).error || "Erro ao salvar."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>+ Nova Atividade</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box" style={{ maxWidth: "620px" }}>
            <div className="modal-header">
              <div className="modal-title">Nova atividade avaliativa</div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Título da atividade *</label>
                  <input className="form-input" placeholder="Ex: Quiz Aula 01" value={form.titulo} onChange={(e) => upd("titulo", e.target.value)} autoFocus />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Tipo de questão</label>
                  <select className="form-input" value={form.tipo} onChange={(e) => upd("tipo", e.target.value)}>
                    <option value="multipla_escolha">Múltipla escolha</option>
                    <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                    <option value="dissertativa">Dissertativa</option>
                    <option value="upload">Upload de arquivo</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Enunciado da questão *</label>
                  <textarea className="form-input form-textarea" rows={3} placeholder="Digite a pergunta…" value={form.questao_texto} onChange={(e) => upd("questao_texto", e.target.value)} />
                </div>
                {form.tipo === "multipla_escolha" && (
                  <>
                    <div className="form-group form-group-full"><label className="form-label">Alternativa A *</label><input className="form-input" value={form.alternativa_a} onChange={(e) => upd("alternativa_a", e.target.value)} /></div>
                    <div className="form-group form-group-full"><label className="form-label">Alternativa B *</label><input className="form-input" value={form.alternativa_b} onChange={(e) => upd("alternativa_b", e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Alternativa C</label><input className="form-input" value={form.alternativa_c} onChange={(e) => upd("alternativa_c", e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Alternativa D</label><input className="form-input" value={form.alternativa_d} onChange={(e) => upd("alternativa_d", e.target.value)} /></div>
                    <div className="form-group form-group-full">
                      <label className="form-label">Resposta correta</label>
                      <select className="form-input" value={form.resposta_correta} onChange={(e) => upd("resposta_correta", e.target.value)}>
                        <option value="0">A</option>
                        <option value="1">B</option>
                        <option value="2">C</option>
                        <option value="3">D</option>
                      </select>
                    </div>
                  </>
                )}
                {form.tipo === "verdadeiro_falso" && (
                  <div className="form-group form-group-full">
                    <label className="form-label">Resposta correta</label>
                    <select className="form-input" value={form.resposta_correta} onChange={(e) => upd("resposta_correta", e.target.value)}>
                      <option value="0">Verdadeiro</option>
                      <option value="1">Falso</option>
                    </select>
                  </div>
                )}
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Criar atividade"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Modal Corrigir Dissertativa ─── */
export function CorrigirModal({ submissao }: { submissao: { id: string; nome_aluno: string; titulo_atividade: string; respostas: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nota, setNota] = useState("0");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const respostas = JSON.parse(submissao.respostas || "{}");

  async function corrigir() {
    const n = Number(nota);
    if (isNaN(n) || n < 0 || n > 10) { setErro("Nota deve ser entre 0 e 10."); return; }
    setSaving(true);
    const res = await fetch(`/api/atividades?id=${submissao.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota: n }),
    });
    setSaving(false);
    if (!res.ok) { setErro("Erro ao salvar nota."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>Corrigir</button>
      {open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Corrigir atividade</div>
                <div className="modal-subtitle">{submissao.nome_aluno} — {submissao.titulo_atividade}</div>
              </div>
              <button className="modal-close" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
            <div className="modal-body">
              {Object.entries(respostas).length > 0 && (
                <div style={{ background: "var(--cj-dark)", border: "1px solid var(--cj-dark-border)", borderRadius: "var(--cj-radius-sm)", padding: "14px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--cj-teal)", marginBottom: "6px" }}>Resposta do aluno</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--cj-text-secondary)" }}>{String(Object.values(respostas)[0])}</div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nota (0–10)</label>
                <input className="form-input" type="number" min="0" max="10" step="0.5" value={nota} onChange={(e) => { setNota(e.target.value); setErro(""); }} />
              </div>
              {erro && <div className="form-error">{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancelar</button>
              <button className="btn btn-primary" onClick={corrigir} disabled={saving}>{saving ? "Salvando…" : "Lançar nota"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
