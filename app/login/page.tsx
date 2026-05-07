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
    if (!form.email.trim() || !form.senha) { setErro("Preencha e-mail e senha."); return; }
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
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-card">
        <div className="login-logo">
          <Image src={LOGO_URL} alt="CondoJob" width={180} height={54} style={{ objectFit: "contain" }} />
          <div><span className="login-logo-tag">Educação EAD</span></div>
        </div>

        <h1 className="login-title">Bem-vindo de volta</h1>
        <p className="login-subtitle">Acesse sua conta para continuar sua formação</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input className="form-input login-input" type="email" placeholder="seu@email.com"
              value={form.email} onChange={(e) => update("email", e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input className="form-input login-input" type="password" placeholder="••••••••"
              value={form.senha} onChange={(e) => update("senha", e.target.value)} />
          </div>

          {erro && <div className="form-error">{erro}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Entrando…" : "Entrar na plataforma →"}
          </button>
        </form>

        <p className="login-footer-text">
          Problemas para acessar?{" "}
          <span style={{ color: "var(--cj-teal)" }}>Fale com seu coordenador.</span>
        </p>
      </div>

      <p className="login-copy">© 2026 CondoJob · Todos os direitos reservados</p>
    </div>
  );
}
