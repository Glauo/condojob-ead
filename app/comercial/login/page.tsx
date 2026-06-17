"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ComercialLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: "", senha: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function upd(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.login.trim() || !form.senha) {
      setErro("Preencha login e senha.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: form.login, senha: form.senha }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Login invalido.");
      return;
    }

    if ((data as { perfil?: string }).perfil !== "comercial") {
      setErro("Este login nao pertence a area comercial.");
      return;
    }

    router.push("/comercial");
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-inner">
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />CRM Comercial</div>
          <h1 className="login-left-title">
            Prospecao premium,
            <br />
            <span className="login-left-title-accent">funil completo e disparos em massa.</span>
          </h1>
          <p className="login-left-desc">
            CondoJob Comercial organiza leads, campanhas, funil e relacionamento em uma operacao inspirada em CRM moderno.
          </p>
          <div className="login-features">
            <div className="login-feature-item"><div className="login-feature-icon">1</div><div><div className="login-feature-title">Leads e funil</div><div className="login-feature-desc">Pipeline organizado por etapa, score e valor potencial.</div></div></div>
            <div className="login-feature-item"><div className="login-feature-icon">2</div><div><div className="login-feature-title">Disparos em massa</div><div className="login-feature-desc">Campanhas de WhatsApp e e-mail com filtros de publico.</div></div></div>
            <div className="login-feature-item"><div className="login-feature-icon">3</div><div><div className="login-feature-title">Mensagens IA</div><div className="login-feature-desc">Biblioteca de copys comerciais otimizadas por objetivo e tom.</div></div></div>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Acesso comercial</h2>
          <p className="login-subtitle">Entre com o login administrativo da equipe comercial.</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Login</label>
              <input className="form-input login-input" value={form.login} onChange={(e) => upd("login", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-input login-input" type="password" value={form.senha} onChange={(e) => upd("senha", e.target.value)} />
            </div>
            {erro && <div className="form-error">{erro}</div>}
            <button className="login-btn" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar no CRM"}</button>
          </form>
          <p className="login-footer-text">
            O administrador pode criar usuarios comerciais em <strong>Coordenador &gt; Alunos &gt; Novo Cadastro</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
