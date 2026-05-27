"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
      </svg>
    ),
    titulo: "Cursos em Vídeo",
    desc: "Aulas gravadas com conteúdo exclusivo para o setor condominial",
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" />
      </svg>
    ),
    titulo: "Atividades Avaliativas",
    desc: "Avalie seu aprendizado com questões práticas após cada aula",
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    titulo: "Certificados Digitais",
    desc: "Certificado reconhecido ao concluir cada curso com aprovação",
  },
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    titulo: "Acesso Sequencial",
    desc: "Trilha de aprendizado estruturada — avance no seu ritmo",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErro("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

      {/* ===== PAINEL ESQUERDO ===== */}
      <div className="login-left">
        <div className="login-left-orb login-left-orb-1" />
        <div className="login-left-orb login-left-orb-2" />

        <div className="login-left-inner">
          <div className="login-left-logo">
            <div className="login-left-logo-wrap">
              <Image src={LOGO_URL} alt="CondoJob" width={160} height={48} style={{ objectFit: "contain" }} />
            </div>
          </div>

          <h1 className="login-left-title">
            Formando o profissional<br />
            <span className="login-left-title-accent">condominial do futuro.</span>
          </h1>
          <p className="login-left-desc">
            A CondoJob Educacional é a plataforma oficial de capacitação condominial, oferecendo cursos,
            conteúdos práticos e certificação para quem deseja se profissionalizar e atuar com
            mais segurança no setor de condomínios.
          </p>

          <div className="login-features">
            {FEATURES.map((f) => (
              <div className="login-feature-item" key={f.titulo}>
                <div className="login-feature-icon">{f.icon}</div>
                <div>
                  <div className="login-feature-title">{f.titulo}</div>
                  <div className="login-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-value">100%</div>
              <div className="login-stat-label">Online</div>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <div className="login-stat-value">24h</div>
              <div className="login-stat-label">Estude de onde quiser</div>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <div className="login-stat-value">✓</div>
              <div className="login-stat-label">Certificado incluso</div>
            </div>
          </div>
        </div>

        <p className="login-copy-left">© 2026 CondoJob · Todos os direitos reservados</p>
      </div>

      {/* ===== PAINEL DIREITO — formulário ===== */}
      <div className="login-right">
        <div className="login-right-orb login-right-orb-1" />
        <div className="login-right-orb login-right-orb-2" />

        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-beacon" />
            <div className="login-logo-wrap">
              <Image src={LOGO_URL} alt="CondoJob" width={190} height={56} style={{ objectFit: "contain" }} />
            </div>
            <div className="login-logo-divider" />
          </div>

          <h2 className="login-title">Bem-vindo de volta</h2>
          <p className="login-subtitle">Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input login-input"
                type="text"
                placeholder="e-mail cadastrado"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input login-input"
                  type={showSenha ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  style={{
                    position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--cj-text-muted)", cursor: "pointer",
                  }}
                >
                  {showSenha ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {erro && <div className="form-error">{erro}</div>}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Entrando…
                </span>
              ) : "Entrar →"}
            </button>
          </form>

          <p className="login-footer-text">
            Problemas para acessar?{" "}
            <span style={{ color: "var(--cj-teal)" }}>Fale com seu coordenador.</span>
            <br />
            Ainda nao tem cadastro?{" "}
            <Link href="/cadastro" style={{ color: "var(--cj-teal)", fontWeight: 700 }}>
              Cadastrar e pagar curso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
