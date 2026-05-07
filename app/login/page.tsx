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
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cj-dark)" }}>

      {/* ── Painel esquerdo — branding ── */}
      <div style={{
        flex: "0 0 48%", position: "relative", overflow: "hidden",
        background: "linear-gradient(145deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "60px 48px",
      }}>
        {/* orbs decorativos */}
        <div style={{ position: "absolute", top: "-80px", left: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, rgba(155,89,182,0.35) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "280px", height: "280px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,206,209,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(155,89,182,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "380px" }}>
          <Image src={LOGO_URL} alt="CondoJob" width={200} height={60} style={{ objectFit: "contain", marginBottom: "32px" }} />

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0,206,209,0.12)", border: "1px solid rgba(0,206,209,0.3)", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--cj-teal)", display: "inline-block" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--cj-teal)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Plataforma EAD</span>
          </div>

          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: "16px" }}>
            Capacitação<br />
            <span style={{ background: "linear-gradient(90deg, var(--cj-purple), var(--cj-teal))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>profissional</span><br />
            sob medida
          </h2>

          <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: "40px" }}>
            Acesse cursos, atividades e certificados da CondoJob em qualquer lugar.
          </p>

          {/* stats decorativos */}
          <div style={{ display: "flex", gap: "24px", justifyContent: "center" }}>
            {[["100%", "Online"], ["24/7", "Disponível"], ["Cert.", "Oficial"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--cj-teal)" }}>{val}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* linha decorativa lateral */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "1px", height: "100%", background: "linear-gradient(to bottom, transparent, rgba(155,89,182,0.4) 30%, rgba(0,206,209,0.4) 70%, transparent)" }} />
      </div>

      {/* ── Painel direito — formulário ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "48px 40px", background: "var(--cj-dark)",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--cj-text)", marginBottom: "8px" }}>
              Bem-vindo de volta
            </h1>
            <p style={{ color: "var(--cj-text-muted)", fontSize: "0.9rem" }}>
              Entre com suas credenciais para acessar a plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--cj-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                E-mail
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoFocus
                style={{ fontSize: "0.95rem", padding: "14px 16px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--cj-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Senha
              </label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.senha}
                onChange={(e) => update("senha", e.target.value)}
                style={{ fontSize: "0.95rem", padding: "14px 16px" }}
              />
            </div>

            {erro && (
              <div style={{ background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "var(--cj-radius-sm)", padding: "12px 14px", fontSize: "0.85rem", color: "#e74c3c" }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "4px", width: "100%", padding: "15px", border: "none", borderRadius: "var(--cj-radius)", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? "var(--cj-dark-panel)" : "linear-gradient(135deg, var(--cj-teal) 0%, var(--cj-teal-dark) 100%)",
                color: loading ? "var(--cj-text-muted)" : "#fff", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em",
                transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 20px rgba(0,206,209,0.3)",
              }}
            >
              {loading ? "Entrando…" : "Entrar na plataforma"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--cj-text-muted)", marginTop: "32px", lineHeight: 1.6 }}>
            Problemas para acessar?{" "}
            <span style={{ color: "var(--cj-teal)", cursor: "pointer" }}>Entre em contato com seu coordenador.</span>
          </p>
        </div>

        {/* rodapé */}
        <div style={{ position: "absolute", bottom: "24px", right: "40px", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
          © 2026 CondoJob · Todos os direitos reservados
        </div>
      </div>

      {/* mobile: esconder painel esquerdo */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="flex: 0 0 48%"] { display: none !important; }
        }
      `}</style>
    </div>
  );
}
