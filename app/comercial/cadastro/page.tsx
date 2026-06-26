"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ComercialCadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", login: "", email: "", senha: "", telefone: "" });
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function upd(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.nome.trim() || !form.login.trim() || !form.email.trim() || !form.senha) {
      setErro("Preencha nome, login, e-mail e senha.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/comercial/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErro((data as { error?: string }).error || "Nao foi possivel criar o acesso comercial.");
      return;
    }

    router.push("/comercial");
    router.refresh();
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-inner">
          <div className="page-eyebrow"><span className="page-eyebrow-dot" />CRM Comercial</div>
          <h1 className="login-left-title">
            Cadastro comercial,
            <br />
            <span className="login-left-title-accent">pipeline, campanhas e prospeccao em um portal proprio.</span>
          </h1>
          <p className="login-left-desc">
            Crie um acesso comercial separado para leads, funil, envios em massa e operacao de vendas da CondoJob.
          </p>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card jobs-auth-card">
          <h2 className="login-title">Cadastro comercial</h2>
          <p className="login-subtitle">Crie um login proprio para entrar no painel comercial.</p>
          <form onSubmit={handleSubmit} className="jobs-form-grid">
            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input login-input" value={form.nome} onChange={(e) => upd("nome", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Login</label>
              <input className="form-input login-input" value={form.login} onChange={(e) => upd("login", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input login-input" type="email" value={form.email} onChange={(e) => upd("email", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input className="form-input login-input" value={form.telefone} onChange={(e) => upd("telefone", e.target.value)} />
            </div>
            <div className="form-group form-group-full">
              <label className="form-label">Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input login-input"
                  type={showSenha ? "text" : "password"}
                  value={form.senha}
                  onChange={(e) => upd("senha", e.target.value)}
                  style={{ paddingRight: 70 }}
                />
                <button type="button" className="jobs-password-toggle" onClick={() => setShowSenha((v) => !v)}>
                  {showSenha ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
            {erro ? <div className="form-error form-group-full">{erro}</div> : null}
            <button className="login-btn form-group-full" type="submit" disabled={loading}>
              {loading ? "Criando acesso..." : "Criar acesso comercial"}
            </button>
          </form>
          <p className="login-footer-text">
            Ja tem acesso?{" "}
            <Link href="/comercial/login" style={{ color: "var(--cj-teal)", fontWeight: 700 }}>
              Entrar no comercial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
