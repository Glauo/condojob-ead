"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [perfil, setPerfil] = useState<"aluno" | "coordenador">("aluno");
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
    const { perfil: p } = await res.json();
    router.push(p === "coordenador" ? "/coordenador" : "/aluno");
  }

  return (
    <div className="login-page">

      {/* ===== PAINEL ESQUERDO — informações da plataforma ===== */}
      <div className="login-left">
        <div className="login-left-orb login-left-orb-1" />
        <div className="login-left-orb login-left-orb-2" />

        <div className="login-left-inner">
          {/* Logo */}
          <div className="login-left-logo">
            <Image src={LOGO_URL} alt="CondoJob" width={160} height={48} style={{ objectFit: "contain" }} />
            <span className="login-left-badge">Educação EAD</span>
          </div>

          {/* Tagline */}
          <h1 className="login-left-title">
            Formando o profissional<br />
            <span className="login-left-title-accent">condominial do futuro.</span>
          </h1>
          <p className="login-left-desc">
            A plataforma oficial CondoJob para capacitação de porteiros,
            síndicos e gestores condominiais com cursos em vídeo e certificação.
          </p>

          {/* Features */}
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

          {/* Stats */}
          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-value">100%</div>
              <div className="login-stat-label">Online</div>
            </div>
            <div className="login-stat-divider" />
            <div className="login-stat">
              <div className="login-stat-value">EAD</div>
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
            <Image src={LOGO_URL} alt="CondoJob" width={150} height={44} style={{ objectFit: "contain" }} />
            <div><span className="login-logo-tag">Área do Aluno & Coordenador</span></div>
          </div>

          {/* Seletor de perfil */}
          <div className="login-role-selector">
            <button
              type="button"
              className={`login-role-btn ${perfil === "aluno" ? "active" : ""}`}
              onClick={() => { setPerfil("aluno"); setErro(""); }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
              Aluno
            </button>
            <button
              type="button"
              className={`login-role-btn ${perfil === "coordenador" ? "active" : ""}`}
              onClick={() => { setPerfil("coordenador"); setErro(""); }}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              Coordenador
            </button>
          </div>

          <h2 className="login-title">
            {perfil === "aluno" ? "Bem-vindo de volta" : "Acesso Administrativo"}
          </h2>
          <p className="login-subtitle">
            {perfil === "aluno"
              ? "Continue sua formação condominial"
              : "Gerencie cursos, alunos e conteúdos"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

            <button
              type="submit"
              className={`login-btn ${perfil === "coordenador" ? "login-btn-coord" : ""}`}
              disabled={loading}
            >
              {loading ? "Entrando…" : perfil === "aluno" ? "Entrar como Aluno →" : "Entrar como Coordenador →"}
            </button>
          </form>

          <p className="login-footer-text">
            Problemas para acessar?{" "}
            <span style={{ color: "var(--cj-teal)" }}>Fale com seu coordenador.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
