"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  perfil: "worker" | "company";
  modo: "login" | "register";
};

type FormState = Record<string, string>;

function initialState(perfil: "worker" | "company", modo: "login" | "register"): FormState {
  if (modo === "login") return { email: "", senha: "" };
  return perfil === "worker"
    ? { nome: "", email: "", senha: "", telefone: "", cidade: "", nivel: "operacional", disponibilidade: "" }
    : { nome: "", responsavel_nome: "", email: "", senha: "", telefone: "", cidade: "", bairro: "", uf: "", endereco: "", total_unidades: "", tipo: "empresa" };
}

export function JobsAuthForm({ perfil, modo }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialState(perfil, modo));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const endpoint = modo === "login" ? "/api/jobs/auth" : "/api/jobs/register";
    const payload = { ...form, perfil };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErro((data as { error?: string }).error || "Nao foi possivel continuar.");
      return;
    }
    router.push((data as { redirectTo?: string }).redirectTo || (perfil === "worker" ? "/profissionais/painel" : "/empresas/painel"));
    router.refresh();
  }

  const title = modo === "login"
    ? perfil === "worker" ? "Entrar como trabalhador" : "Entrar como empresa"
    : perfil === "worker" ? "Cadastro do trabalhador" : "Cadastro da empresa";

  const subtitle = modo === "login"
    ? perfil === "worker" ? "Acesse as vagas e aceite os trabalhos disponiveis." : "Entre para publicar vagas e acompanhar os aceites."
    : perfil === "worker" ? "Crie seu acesso para receber vagas e aceitar servicos." : "Crie o acesso da empresa para publicar vagas na plataforma.";

  return (
    <div className="login-card jobs-auth-card">
      <h2 className="login-title">{title}</h2>
      <p className="login-subtitle">{subtitle}</p>

      <form onSubmit={handleSubmit} className="jobs-form-grid">
        {modo === "register" && (
          <>
            <div className="form-group">
              <label className="form-label">{perfil === "worker" ? "Nome completo" : "Nome da empresa"}</label>
              <input className="form-input login-input" value={form.nome || ""} onChange={(e) => update("nome", e.target.value)} />
            </div>
            {perfil === "company" && (
              <div className="form-group">
                <label className="form-label">Responsavel</label>
                <input className="form-input login-input" value={form.responsavel_nome || ""} onChange={(e) => update("responsavel_nome", e.target.value)} />
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <label className="form-label">E-mail</label>
          <input className="form-input login-input" type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Senha</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input login-input"
              type={showSenha ? "text" : "password"}
              value={form.senha || ""}
              onChange={(e) => update("senha", e.target.value)}
              style={{ paddingRight: 52 }}
            />
            <button type="button" className="jobs-password-toggle" onClick={() => setShowSenha((v) => !v)}>
              {showSenha ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {modo === "register" && (
          <>
            <div className="form-group">
              <label className="form-label">WhatsApp</label>
              <input className="form-input login-input" value={form.telefone || ""} onChange={(e) => update("telefone", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input className="form-input login-input" value={form.cidade || ""} onChange={(e) => update("cidade", e.target.value)} />
            </div>

            {perfil === "worker" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Nivel profissional</label>
                  <select className="form-input login-input" value={form.nivel || "operacional"} onChange={(e) => update("nivel", e.target.value)}>
                    <option value="operacional">Operacional</option>
                    <option value="premium">Premium</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Disponibilidade</label>
                  <textarea className="form-input login-input jobs-textarea" value={form.disponibilidade || ""} onChange={(e) => update("disponibilidade", e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Bairro</label>
                  <input className="form-input login-input" value={form.bairro || ""} onChange={(e) => update("bairro", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">UF</label>
                  <input className="form-input login-input" value={form.uf || ""} onChange={(e) => update("uf", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input login-input" value={form.tipo || "empresa"} onChange={(e) => update("tipo", e.target.value)}>
                    <option value="empresa">Empresa</option>
                    <option value="condominio">Condominio</option>
                    <option value="administradora">Administradora</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unidades</label>
                  <input className="form-input login-input" value={form.total_unidades || ""} onChange={(e) => update("total_unidades", e.target.value)} />
                </div>
                <div className="form-group form-group-full">
                  <label className="form-label">Endereco</label>
                  <input className="form-input login-input" value={form.endereco || ""} onChange={(e) => update("endereco", e.target.value)} />
                </div>
              </>
            )}
          </>
        )}

        {erro ? <div className="form-error form-group-full">{erro}</div> : null}

        <button type="submit" className="login-btn form-group-full" disabled={loading}>
          {loading ? "Processando..." : modo === "login" ? "Entrar" : "Criar acesso"}
        </button>
      </form>

      <p className="login-footer-text">
        {modo === "login" ? (
          <>
            {perfil === "worker" ? "Ainda nao tem acesso? " : "Ainda nao cadastrou sua empresa? "}
            <Link href={perfil === "worker" ? "/profissionais/cadastro" : "/empresas/cadastro"} style={{ color: "var(--cj-teal)", fontWeight: 700 }}>
              Criar cadastro
            </Link>
          </>
        ) : (
          <>
            Ja tem acesso?{" "}
            <Link href={perfil === "worker" ? "/profissionais/login" : "/empresas/login"} style={{ color: "var(--cj-teal)", fontWeight: 700 }}>
              Entrar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
