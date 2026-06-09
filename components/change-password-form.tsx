"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMessage("");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.senhaAtual || !form.novaSenha || !form.confirmarSenha) {
      setError("Preencha todos os campos.");
      return;
    }
    if (form.novaSenha !== form.confirmarSenha) {
      setError("A confirmacao nao confere com a nova senha.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/aluno/senha", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError((data as { error?: string }).error || "Nao foi possivel alterar a senha.");
      return;
    }

    setForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
    setMessage("Senha alterada com sucesso.");
  }

  return (
    <form onSubmit={submit} className="card" style={{ padding: "22px", display: "grid", gap: "16px", maxWidth: "560px" }}>
      <div>
        <h2 className="section-title" style={{ margin: 0 }}>Alterar senha</h2>
        <p style={{ marginTop: "6px", color: "var(--cj-text-muted)", fontSize: "0.88rem" }}>Use esta area para trocar a senha temporaria recebida por e-mail ou WhatsApp.</p>
      </div>

      <label className="form-group">
        <span className="form-label">Senha atual</span>
        <input
          className="form-input"
          type={show ? "text" : "password"}
          value={form.senhaAtual}
          onChange={(e) => update("senhaAtual", e.target.value)}
        />
      </label>

      <label className="form-group">
        <span className="form-label">Nova senha</span>
        <input
          className="form-input"
          type={show ? "text" : "password"}
          value={form.novaSenha}
          onChange={(e) => update("novaSenha", e.target.value)}
        />
      </label>

      <label className="form-group">
        <span className="form-label">Confirmar nova senha</span>
        <input
          className="form-input"
          type={show ? "text" : "password"}
          value={form.confirmarSenha}
          onChange={(e) => update("confirmarSenha", e.target.value)}
        />
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--cj-text-secondary)", fontSize: "0.86rem" }}>
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Mostrar senhas
      </label>

      {error && <div className="form-error">{error}</div>}
      {message && <div style={{ color: "var(--cj-teal)", fontWeight: 700, fontSize: "0.88rem" }}>{message}</div>}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
