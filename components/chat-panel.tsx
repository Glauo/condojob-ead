"use client";

import { useState } from "react";

export type ChatMessage = {
  id: string;
  aluno_id: string;
  coordenador_id: string | null;
  remetente_id: string;
  remetente_nome: string;
  remetente_perfil: "aluno" | "coordenador";
  mensagem: string;
  lida: boolean;
  criado_em: string;
};

export function ChatPanel({
  initialMessages,
  currentUserId,
  alunoId,
}: {
  initialMessages: ChatMessage[];
  currentUserId: string;
  alunoId?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    const mensagem = text.trim();
    if (!mensagem) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem, aluno_id: alunoId }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || "Erro ao enviar mensagem.");
      return;
    }
    const msg = (await res.json()) as ChatMessage;
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="section-eyebrow">Atendimento</div>
          <h3 className="section-title">Chat com o coordenador</h3>
        </div>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
          {messages.length === 0 ? (
            <p style={{ color: "var(--cj-text-muted)", fontSize: "0.85rem" }}>
              Envie sua primeira mensagem para o coordenador.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.remetente_id === currentUserId;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "86%",
                    background: mine ? "rgba(56,189,248,0.12)" : "rgba(129,140,248,0.10)",
                    border: mine ? "1px solid rgba(56,189,248,0.24)" : "1px solid rgba(129,140,248,0.22)",
                    borderRadius: "12px",
                    padding: "9px 11px",
                  }}
                >
                  <div style={{ fontSize: "0.7rem", color: "var(--cj-text-muted)", marginBottom: "2px" }}>
                    {mine ? "Voce" : m.remetente_nome}
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "var(--cj-text)", whiteSpace: "pre-wrap" }}>{m.mensagem}</div>
                  <div style={{ fontSize: "0.66rem", color: "var(--cj-text-muted)", marginTop: "4px" }}>
                    {new Date(m.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <textarea
          className="form-input form-textarea"
          rows={3}
          placeholder="Escreva sua duvida ou solicite suporte..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {error && <div className="form-error">{error}</div>}
        <button className="btn btn-primary" onClick={send} disabled={saving || !text.trim()}>
          {saving ? "Enviando..." : "Enviar mensagem"}
        </button>
      </div>
    </div>
  );
}
