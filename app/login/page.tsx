"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErro((d as { error?: string }).error || "E-mail ou senha incorretos.");
      return;
    }
    const { perfil } = await res.json();
    router.push(perfil === "coordenador" ? "/coordenador" : "/aluno");
  }

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        <div className="login-logo">
          <Image src={LOGO_URL} alt="CondoJob" width={160} height={48} style={{ objectFit: "contain" }} />
          <div>
            <span className="login-logo-tag">Educação EAD</span>
          </div>
        </div>

        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acesse sua conta para continuar sua formação</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-input"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={(e) => update("senha", e.target.value)}
            />
          </div>

          {erro && <div className="form-error">{erro}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ justifyContent: "center", marginTop: "4px" }}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--cj-text-muted)", marginTop: "24px" }}>
          Problemas para acessar? Entre em contato com seu coordenador.
        </p>
      </div>
    </div>
  );
}
