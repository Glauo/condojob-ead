import Image from "next/image";
import Link from "next/link";
import { JobsAuthForm } from "@/components/jobs-auth-form";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663028326461/T5ftWUvfkBh5pRx7KLbqse/condojob-logo-cropped_a273700c.png";

export default function ProfissionaisLoginPage() {
  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-orb login-left-orb-1" />
        <div className="login-left-orb login-left-orb-2" />
        <div className="login-left-inner">
          <div className="login-left-logo">
            <div className="login-left-logo-wrap">
              <Image src={LOGO_URL} alt="CondoJob" width={160} height={48} style={{ objectFit: "contain" }} />
            </div>
          </div>
          <h1 className="login-left-title">Acesso do trabalhador<br /><span className="login-left-title-accent">Pegue a vaga e confirme o trabalho.</span></h1>
          <p className="login-left-desc">Entre para acompanhar vagas ativas, aceitar servicos disponiveis e centralizar seu historico profissional dentro da CondoJob.</p>
          <div className="jobs-login-links">
            <Link href="/profissionais/oportunidades" className="jobs-btn jobs-btn-secondary">Ver vagas</Link>
            <Link href="/profissionais/cadastro" className="jobs-btn jobs-btn-primary">Criar cadastro</Link>
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-right-orb login-right-orb-1" />
        <div className="login-right-orb login-right-orb-2" />
        <JobsAuthForm perfil="worker" modo="login" />
      </div>
    </div>
  );
}
